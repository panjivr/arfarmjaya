"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { distributionTrend, inventoryTrend } from "@/lib/data";

export function InventoryValueChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={inventoryTrend}>
        <defs>
          <linearGradient id="inventoryValue" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => [`${value}B`, "Inventory Value"]} />
        <Area type="monotone" dataKey="value" stroke="#166534" strokeWidth={3} fill="url(#inventoryValue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenuePurchaseChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={inventoryTrend}>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="purchase" name="Purchases" fill="#166534" radius={[6, 6, 0, 0]} />
        <Bar dataKey="revenue" name="Revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={distributionTrend} layout="vertical">
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="status" width={82} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="orders" fill="#22C55E" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
