import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:bg-emerald-800",
        variant === "secondary" && "border border-border bg-card text-foreground hover:bg-slate-50 dark:hover:bg-slate-900",
        variant === "ghost" && "text-muted hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-900",
        variant === "danger" && "bg-danger text-white hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}
