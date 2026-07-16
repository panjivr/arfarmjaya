"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUiStore } from "@/lib/store";
import { categoryStats } from "@/lib/selectors";
import { compactNumber } from "@/lib/utils";

const PALETTE = ["#007A4B", "#76B852", "#F6B333", "#FBD46D", "#0EA5E9", "#8B5CF6", "#EF4444", "#64748B"];

export function InventoryByCategoryChart() {
  const products = useUiStore((s) => s.products);
  const data = useMemo(() => categoryStats(products).slice(0, 8).map((c) => ({ name: c.name, value: Math.round(c.value / 1_000_000) })), [products]);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: -12 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={50} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`${v} jt`, "Nilai"]} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StockFlowChart() {
  const movements = useUiStore((s) => s.movements);
  const data = useMemo(() => {
    const days: { key: string; label: string; masuk: number; keluar: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), masuk: 0, keluar: 0 });
    }
    movements.forEach((m) => {
      const key = m.createdAt.slice(0, 10);
      const day = days.find((x) => x.key === key);
      if (!day) return;
      if (m.type === "in") day.masuk += m.quantity;
      else if (m.type === "out" || m.type === "sale" || m.type === "transfer") day.keluar += m.quantity;
    });
    return days;
  }, [movements]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: -12 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
        <Legend />
        <Line type="monotone" dataKey="masuk" name="Masuk" stroke="#007A4B" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="keluar" name="Keluar" stroke="#F6B333" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StockStatusChart() {
  const products = useUiStore((s) => s.products);
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.status, (counts.get(p.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => compactNumber.format(v as number)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
