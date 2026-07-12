import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(3),
  barcode: z.string().min(8),
  name: z.string().min(2),
  categoryId: z.string().min(1),
  supplierId: z.string().min(1),
  warehouseId: z.string().min(1),
  unit: z.string().min(1),
  purchasePrice: z.coerce.number().positive(),
  retailPrice: z.coerce.number().positive(),
  minimumStock: z.coerce.number().int().nonnegative(),
  maximumStock: z.coerce.number().int().positive(),
  currentStock: z.coerce.number().int().nonnegative(),
});

export const approvalSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject", "cancel"]),
  note: z.string().max(500).optional(),
});
