import { ArrowRight, CheckCircle2, Clock3, Database, Plus, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ModulePageProps = {
  title: string;
  description: string;
  stages?: string[];
  records?: string[];
  actions?: string[];
};

export function ModulePage({ title, description, stages = [], records = [], actions = [] }: ModulePageProps) {
  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">AR FARM JAYA / {title}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
        </div>
        <Button><Plus className="h-4 w-4" /> New Record</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Operational Workflow</h2>
                <p className="text-sm text-muted">Approval-ready process tracking with audit history.</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {(stages.length ? stages : ["Draft", "Approval", "Execution", "Review", "Completed"]).map((stage, index, list) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3">
                    <p className="font-medium">{stage}</p>
                    <p className="text-xs text-muted">SLA, permissions, and notifications configured.</p>
                  </div>
                  {index < list.length - 1 && <ArrowRight className="hidden h-4 w-4 text-muted sm:block" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Controls</h2>
            <p className="text-sm text-muted">Enterprise controls prepared for production.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(actions.length ? actions : ["Search", "Filter", "Export", "Approve", "Audit"]).map((action) => (
                <div key={action} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Recent Records</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(records.length ? records : ["Awaiting approval", "Synced with inventory", "Ready for export"]).map((record) => (
              <div key={record} className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-primary">Active</span>
                  <Clock3 className="h-4 w-4 text-muted" />
                </div>
                <p className="font-semibold">{record}</p>
                <p className="mt-2 text-sm text-muted">Validated by RBAC, Zod schema, and audit log pipeline.</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
