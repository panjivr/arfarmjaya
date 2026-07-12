"use server";

import { revalidatePath } from "next/cache";
import { approvalSchema, productSchema } from "@/lib/validations";

export async function createProductAction(formData: FormData) {
  const payload = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  revalidatePath("/inventory");
  return { ok: true, data: parsed.data };
}

export async function approveWorkflowAction(formData: FormData) {
  const parsed = approvalSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  revalidatePath("/");
  return { ok: true, data: parsed.data };
}
