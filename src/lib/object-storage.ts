import { createHash } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export function objectStorageConfigured() {
  return ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"].every(key => Boolean(process.env[key]));
}
function client() {
  if (!objectStorageConfigured()) throw new Error("Object storage is not configured");
  return new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! } });
}
export async function uploadImage(bytes: Buffer, mime: string) {
  if (bytes.length > 3_000_000 || bytes.length === 0) throw new Error("invalid_image_size");
  const magic = mime === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8
    : mime === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : mime === "image/webp" ? bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" : false;
  if (!magic) throw new Error("invalid_image_type");
  const digest = createHash("sha256").update(bytes).digest("hex");
  await client().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: `attachments/${digest}`, Body: bytes, ContentType: mime }));
  return digest;
}
export async function getImage(digest: string) {
  const response = await client().send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: `attachments/${digest}` }));
  if (!response.Body) throw new Error("image_missing");
  return { bytes: await response.Body.transformToByteArray(), mime: response.ContentType ?? "application/octet-stream" };
}
// Offload embedded legacy photos on the next edit. Uploads happen BEFORE the
// database transaction; an upload failure never commits dangling references.
export async function externalizeImages(value: unknown, known: Set<string>, references = new Set<string>()): Promise<unknown> {
  if (typeof value === "string") {
    const existing = /^\/api\/files\/([a-f0-9]{64})$/.exec(value);
    if (existing) { known.add(existing[1]); references.add(existing[1]); return value; }
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
    if (match && objectStorageConfigured()) {
      const digest = await uploadImage(Buffer.from(match[2], "base64"), match[1]);
      known.add(digest); return `/api/files/${digest}`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    const out = []; for (const child of value) out.push(await externalizeImages(child, known, references)); return out;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) out[key] = await externalizeImages(child, known, references);
    return out;
  }
  return value;
}
