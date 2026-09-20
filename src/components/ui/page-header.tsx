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
    <div className="mb-5 flex flex-col gap-3 sm:mb-7 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-[1.9rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

const statTones: Record<string, { chip: string; accent: string }> = {
  primary: { chip: "bg-primary/10 text-primary", accent: "before:bg-primary" },
  amber: { chip: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300", accent: "before:bg-amber-500" },
  danger: { chip: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300", accent: "before:bg-red-500" },
  slate: { chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", accent: "before:bg-slate-400" },
  sky: { chip: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300", accent: "before:bg-sky-500" },
};

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
  tone?: "primary" | "amber" | "danger" | "slate" | "sky";
}) {
  const t = statTones[tone] ?? statTones.primary;
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5",
        // aksen tipis di tepi kiri untuk penekanan (dominasi) yang halus
        "before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-full before:content-['']",
        t.accent,
      )}
    >
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold leading-tight tracking-tight sm:text-[1.6rem]">{value}</p>
        </div>
        {Icon && (
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", t.chip)}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      {hint && <p className="mt-2.5 truncate pl-2 text-xs font-medium text-muted sm:mt-3">{hint}</p>}
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-card-muted p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
