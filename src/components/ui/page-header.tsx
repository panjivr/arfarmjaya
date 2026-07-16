import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "amber" | "danger" | "slate";
}) {
  const tones = {
    primary: "bg-leaf/10 text-primary",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40",
    danger: "bg-red-50 text-danger dark:bg-red-950/40",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold">{value}</p>
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-2", tones[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {hint && <p className="mt-3 text-xs font-medium text-primary">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-10 text-center">
      <Icon className="h-9 w-9 text-muted" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
