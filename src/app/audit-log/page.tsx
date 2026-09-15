"use client";

import { useMemo, useState } from "react";
import { Download, ShieldCheck, Users, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { useUiStore } from "@/lib/store";
import { formatDateTime, exportCsv } from "@/lib/utils";
import type { AuditEntry } from "@/lib/types";

export default function AuditLogPage() {
  const auditLog = useUiStore((s) => s.auditLog);

  const [actor, setActor] = useState("");
  const [entity, setEntity] = useState("");

  const actors = useMemo(() => Array.from(new Set(auditLog.map((e) => e.actor))).sort(), [auditLog]);
  const entities = useMemo(() => Array.from(new Set(auditLog.map((e) => e.entity))).sort(), [auditLog]);

  const filtered = useMemo(
    () => auditLog.filter((e) => (!actor || e.actor === actor) && (!entity || e.entity === entity)),
    [auditLog, actor, entity],
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = auditLog.filter((e) => e.createdAt.slice(0, 10) === todayKey).length;

  const columns: Column<AuditEntry>[] = [
    { key: "createdAt", header: "Waktu", render: (e) => <span className="whitespace-nowrap text-muted">{formatDateTime(e.createdAt)}</span> },
    { key: "actor", header: "Aktor", render: (e) => <span className="font-medium">{e.actor}</span> },
    { key: "action", header: "Aksi", render: (e) => <Badge className="bg-leaf/10 text-primary">{e.action}</Badge> },
    { key: "entity", header: "Entitas", render: (e) => e.entity },
    { key: "detail", header: "Detail", render: (e) => <span className="text-muted">{e.detail}</span> },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Sistem"
        title="Log Audit"
        description="Jejak audit yang mencatat siapa mengubah apa dan kapan terjadi."
        action={
          <Button
            variant="secondary"
            onClick={() =>
              exportCsv(
                "log-audit",
                filtered.map((e) => ({
                  waktu: e.createdAt,
                  aktor: e.actor,
                  aksi: e.action,
                  entitas: e.entity,
                  detail: e.detail,
                })),
              )
            }
          >
            <Download className="h-4 w-4" /> Ekspor CSV
          </Button>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
        <StatCard label="Total Entri" value={auditLog.length} icon={ShieldCheck} tone="slate" />
        <StatCard label="Aktor Unik" value={actors.length} icon={Users} tone="primary" />
        <StatCard label="Entri Hari Ini" value={todayCount} icon={CalendarClock} tone="amber" />
      </section>

      {auditLog.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Belum ada aktivitas" description="Aktivitas sistem akan tercatat di sini secara otomatis." />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(e) => e.id}
          searchPlaceholder="Cari aktivitas..."
          searchFields={(e) => `${e.actor} ${e.action} ${e.entity} ${e.detail}`}
          emptyTitle="Tidak ada hasil"
          emptyDescription="Sesuaikan filter untuk melihat entri lain."
          toolbar={
            <>
              <Select value={actor} onChange={(e) => setActor(e.target.value)} className="h-10 w-auto">
                <option value="">Semua Aktor</option>
                {actors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
              <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="h-10 w-auto">
                <option value="">Semua Entitas</option>
                {entities.map((en) => (
                  <option key={en} value={en}>
                    {en}
                  </option>
                ))}
              </Select>
            </>
          }
        />
      )}
    </AppShell>
  );
}
