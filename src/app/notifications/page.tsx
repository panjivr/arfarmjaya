"use client";

import { AlertTriangle, Bell, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/store";
import { buildNotifications, type NotificationItem } from "@/lib/selectors";

const kindConfig: Record<
  NotificationItem["kind"],
  { icon: React.ComponentType<{ className?: string }>; wrap: string; iconColor: string }
> = {
  danger: { icon: ShieldAlert, wrap: "bg-red-50 dark:bg-red-950/40", iconColor: "text-danger" },
  warning: { icon: AlertTriangle, wrap: "bg-amber-50 dark:bg-amber-950/40", iconColor: "text-amber-700 dark:text-amber-500" },
  info: { icon: Info, wrap: "bg-slate-100 dark:bg-slate-800", iconColor: "text-slate-600 dark:text-slate-300" },
};

export default function NotificationsPage() {
  const products = useUiStore((s) => s.products);
  const settings = useUiStore((s) => s.settings);
  const readNotifications = useUiStore((s) => s.readNotifications);
  const markNotificationRead = useUiStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useUiStore((s) => s.markAllNotificationsRead);

  const items = buildNotifications(products, settings);
  const readSet = new Set(readNotifications);
  const unread = items.filter((i) => !readSet.has(i.id));
  const critical = items.filter((i) => i.kind === "danger");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Sistem"
        title="Notifikasi"
        description="Peringatan operasional untuk stok rendah, stok habis, dan barang yang mendekati kedaluwarsa."
        action={
          items.length > 0 && unread.length > 0 ? (
            <Button variant="secondary" onClick={() => markAllNotificationsRead(items.map((i) => i.id))}>
              <CheckCircle2 className="h-4 w-4" /> Tandai semua dibaca
            </Button>
          ) : undefined
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard label="Total Peringatan" value={items.length} icon={Bell} tone="slate" />
        <StatCard label="Belum Dibaca" value={unread.length} icon={AlertTriangle} tone="amber" />
        <StatCard label="Kritis" value={critical.length} icon={ShieldAlert} tone="danger" />
      </section>

      {items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Semua stok aman" description="Tidak ada peringatan yang perlu ditindaklanjuti saat ini." />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const cfg = kindConfig[item.kind];
            const Icon = cfg.icon;
            const isUnread = !readSet.has(item.id);
            return (
              <li
                key={item.id}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className={`rounded-lg p-2 ${cfg.wrap}`}>
                  <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Belum dibaca" />}
                    <p className="font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.detail}</p>
                </div>
                {isUnread && (
                  <Button variant="ghost" className="shrink-0" onClick={() => markNotificationRead(item.id)}>
                    Tandai dibaca
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
