"use client";

import { Field, Select } from "@/components/ui/field";
import { FEED_CATALOG, findFeed, type FeedProduct } from "@/lib/feed";

/**
 * Pemilih pakan berdasarkan katalog merk + produk. Saat produk dipilih, memanggil
 * onPick dengan detailnya sehingga pemanggil bisa mengisi merk, kode, dan
 * memperkirakan biaya dari harga per kg.
 */
export function FeedSelect({
  brand,
  code,
  onPick,
}: {
  brand?: string;
  code?: string;
  onPick: (feed: FeedProduct | null, raw: { brand: string; code: string }) => void;
}) {
  const selectedKey = brand && code ? `${brand}||${code}` : "";
  return (
    <Field label="Pakan (merk · produk)" hint="Pilih dari katalog atau ketik manual di catatan.">
      <Select
        value={selectedKey}
        onChange={(e) => {
          const [b, c] = e.target.value.split("||");
          const feed = findFeed(b, c) ?? null;
          onPick(feed, { brand: b ?? "", code: c ?? "" });
        }}
      >
        <option value="">— pilih pakan —</option>
        {FEED_CATALOG.map((f) => (
          <option key={`${f.brand}||${f.code}`} value={`${f.brand}||${f.code}`}>
            {f.brand} · {f.code} — {f.pelletMm}, protein {f.proteinPct}% (± Rp{f.pricePerKg.toLocaleString("id-ID")}/kg)
          </option>
        ))}
      </Select>
    </Field>
  );
}
