import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 select-none items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-primary text-white shadow-soft hover:bg-primary-strong",
        variant === "secondary" && "border border-border bg-card text-foreground shadow-soft hover:border-border-strong hover:bg-card-muted",
        variant === "ghost" && "text-muted hover:bg-card-muted hover:text-foreground",
        variant === "danger" && "bg-danger text-white shadow-soft hover:bg-red-700",
        className,
      )}
      {...props}
    />
  );
}
