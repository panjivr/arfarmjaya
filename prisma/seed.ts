import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.upsert({
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
    update: {},
    create: {
      name: "Admin Utama",
      email: "owner@arfarmjaya.com",
      roleId: role.id,
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
    update: {},
    create: {
      name: "Karyawan Gudang",
      email: "karyawan@arfarmjaya.com",
      roleId: staffRole.id,
    },
  });

  const category = await prisma.category.upsert({
    where: { name: "Feed" },
    update: {},
    create: { name: "Feed" },
  });

  const supplier = await prisma.supplier.create({
    data: {
      company: "PT Agro Nutrisi Prima",
      contact: "Budi Santoso",
      phone: "+62 812 0000 1122",
      email: "procurement@agronutrisi.example",
      address: "Jakarta, Indonesia",
      taxNumber: "01.234.567.8-999.000",
      paymentTerms: "Net 30",
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { name: "Dry Storage" },
    update: {},
    create: { name: "Dry Storage", type: "DRY" },
  });

  const rack = await prisma.rack.create({
    data: { code: "A-01-01", warehouseId: warehouse.id },
  });

  await prisma.product.upsert({
    where: { sku: "AFJ-FEED-001" },
    update: {},
    create: {
      sku: "AFJ-FEED-001",
      barcode: "8997001200011",
      name: "Premium Layer Feed 50kg",
      brand: "AR Select",
      unit: "Bag",
      purchasePrice: 315000,
      retailPrice: 345000,
      minimumStock: 80,
      maximumStock: 420,
      currentStock: 312,
      locationRack: "A-01-01",
      batchNumber: "B2407-LF",
      expirationDate: new Date("2026-11-20"),
      categoryId: category.id,
      supplierId: supplier.id,
      warehouseId: warehouse.id,
      rackId: rack.id,
    },
  });
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
