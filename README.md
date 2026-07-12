# AR FARM JAYA WMS

Enterprise Warehouse Management System for AR FARM JAYA.

## Features

- Executive dashboard with inventory, purchase, distribution, retail, revenue, and expense metrics
- Inventory master data with SKU, barcode, QR code-ready fields, rack, warehouse, supplier, batch, and expiration tracking
- Purchasing, receiving goods, inventory transactions, distribution, request goods, stock opname, and retail POS modules
- Reports, analytics, users and roles, notifications, audit log, and system settings
- Responsive dashboard shell with sidebar navigation, global search command palette, charts, and advanced tables
- PostgreSQL and Prisma schema for normalized production data
- Zod validated server actions and RBAC-ready architecture

## Stack

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Prisma and PostgreSQL
- Better Auth-ready authentication boundary
- Zustand
- TanStack Table
- Recharts
- React Hook Form and Zod
- Lucide Icons
- Framer Motion

## Getting Started

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Open `http://localhost:3000`.

## Database

Set `DATABASE_URL` in `.env`, then run:

```bash
npm run prisma:migrate
npm run prisma:seed
```

## Architecture

See `docs/ARCHITECTURE.md` for the module map, security model, API architecture, and ERD.
