import { PrismaClient, ProductStatus } from "@prisma/client";
import { realStockProducts } from "../src/lib/stock-products";

const prisma = new PrismaClient();

function mapStatus(status: string): ProductStatus {
  if (status === "Habis") return ProductStatus.OUT_OF_STOCK;
  if (status === "Stok Rendah") return ProductStatus.LOW_STOCK;
  if (status === "Hampir Kedaluwarsa") return ProductStatus.EXPIRING;
  if (status === "Karantina") return ProductStatus.QUARANTINE;
  return ProductStatus.AVAILABLE;
}

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin Utama" },
    update: {},
    create: {
      name: "Admin Utama",
      permissions: {
        create: [
          { action: "manage", subject: "all" },
          { action: "approve", subject: "purchase" },
          { action: "export", subject: "reports" },
        ],
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "owner@arfarmjaya.com" },
    update: { name: "Admin Utama", roleId: adminRole.id },
    create: {
      name: "Admin Utama",
      email: "owner@arfarmjaya.com",
      roleId: adminRole.id,
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: "Karyawan Gudang" },
    update: {},
    create: {
      name: "Karyawan Gudang",
      permissions: {
        create: [
          { action: "create", subject: "stock-out" },
          { action: "read", subject: "stock-out" },
        ],
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "karyawan@arfarmjaya.com" },
    update: { name: "Karyawan Gudang", roleId: staffRole.id },
    create: {
      name: "Karyawan Gudang",
      email: "karyawan@arfarmjaya.com",
      roleId: staffRole.id,
    },
  });

  const supplier =
    (await prisma.supplier.findFirst({
      where: { company: "Data Stock Gudang ARFARM" },
    })) ??
    (await prisma.supplier.create({
      data: {
        company: "Data Stock Gudang ARFARM",
        contact: "Admin Gudang",
        phone: "-",
        email: "gudang@arfarmjaya.com",
        address: "Gudang Bahan Baku AR FARM JAYA",
        taxNumber: "-",
        paymentTerms: "Internal",
      },
    }));

  const warehouse = await prisma.warehouse.upsert({
    where: { name: "Gudang Bahan Baku" },
    update: { type: "RAW_MATERIAL" },
    create: { name: "Gudang Bahan Baku", type: "RAW_MATERIAL" },
  });

  const rack = await prisma.rack.upsert({
    where: {
      code_warehouseId: {
        code: "BB-01-01",
        warehouseId: warehouse.id,
      },
    },
    update: {},
    create: { code: "BB-01-01", warehouseId: warehouse.id },
  });

  const categoryByName = new Map<string, string>();
  for (const product of realStockProducts) {
    if (categoryByName.has(product.category)) continue;
    const category = await prisma.category.upsert({
      where: { name: product.category },
      update: {},
      create: { name: product.category },
    });
    categoryByName.set(product.category, category.id);
  }

  for (const product of realStockProducts) {
    const categoryId = categoryByName.get(product.category);
    if (!categoryId) {
      throw new Error(`Kategori tidak ditemukan untuk ${product.name}`);
    }

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        retailPrice: product.retailPrice,
        minimumStock: product.minStock,
        maximumStock: product.maxStock,
        currentStock: product.currentStock,
        locationRack: product.rack,
        batchNumber: product.batch,
        expirationDate: new Date(product.lastUpdate ?? product.expirationDate),
        status: mapStatus(product.status),
        notes: `Stok awal: ${product.initialStock ?? 0}, masuk: ${product.stockIn ?? 0}, keluar: ${product.stockOut ?? 0}, last update: ${product.lastUpdate ?? "-"}`,
        categoryId,
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        rackId: rack.id,
      },
      create: {
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        retailPrice: product.retailPrice,
        minimumStock: product.minStock,
        maximumStock: product.maxStock,
        currentStock: product.currentStock,
        locationRack: product.rack,
        batchNumber: product.batch,
        expirationDate: new Date(product.lastUpdate ?? product.expirationDate),
        status: mapStatus(product.status),
        notes: `Stok awal: ${product.initialStock ?? 0}, masuk: ${product.stockIn ?? 0}, keluar: ${product.stockOut ?? 0}, last update: ${product.lastUpdate ?? "-"}`,
        categoryId,
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        rackId: rack.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
