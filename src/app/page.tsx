import { AlertTriangle, ArrowUpRight, Package, ReceiptText, Truck } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DistributionChart, InventoryValueChart, RevenuePurchaseChart } from "@/components/dashboard/charts";
import { ProductTable } from "@/components/inventory/product-table";
import { currency, compactNumber } from "@/lib/utils";
import { metrics, products } from "@/lib/data";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">AR FARM JAYA</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Warehouse Management System</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Executive control center for inventory, purchasing, receiving, distribution, retail POS, analytics, and audit-ready operations.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-2 text-center text-xs">
          <div className="rounded-md bg-green-50 px-3 py-2 text-primary">
            <Package className="mx-auto mb-1 h-4 w-4" />
            FIFO
          </div>
          <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-700">
            <AlertTriangle className="mx-auto mb-1 h-4 w-4" />
            FEFO
          </div>
          <div className="rounded-md bg-slate-100 px-3 py-2 text-slate-700">
            <Truck className="mx-auto mb-1 h-4 w-4" />
            Live
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold">
                    {metric.label.includes("Value") || metric.label.includes("Sales")
                      ? currency.format(metric.value)
                      : compactNumber.format(metric.value)}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-2 text-primary">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-primary">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Inventory Value</h2>
            <p className="text-sm text-muted">Monthly valuation trend in billion IDR.</p>
          </CardHeader>
          <CardContent>
            <InventoryValueChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Purchases vs Revenue</h2>
            <p className="text-sm text-muted">Purchasing, retail sales, and operating cash flow view.</p>
          </CardHeader>
          <CardContent>
            <RevenuePurchaseChart />
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Inventory Control</h2>
            <p className="text-sm text-muted">Search, filter, sort, import, export, batch, rack, and expiration tracking.</p>
          </CardHeader>
          <CardContent className="p-0">
            <ProductTable />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Distribution Today</h2>
            <p className="text-sm text-muted">Picking through completed delivery status.</p>
          </CardHeader>
          <CardContent>
            <DistributionChart />
            <div className="mt-4 space-y-3">
              {products.slice(0, 3).map((product) => (
                <div key={product.sku} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <ReceiptText className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-muted">{product.rack} / {product.batch}</p>
                  </div>
                  <span className="text-sm font-semibold">{product.currentStock}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
