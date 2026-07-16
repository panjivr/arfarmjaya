"use client";

import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type Kind = "success" | "error" | "info";
type Toast = { id: string; kind: Kind; message: string };

type ToastState = {
  toasts: Toast[];
  push: (kind: Kind, message: string) => void;
  dismiss: (id: string) => void;
};

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push("success", message),
  error: (message: string) => useToastStore.getState().push("error", message),
  info: (message: string) => useToastStore.getState().push("info", message),
};

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const colors = {
  success: "border-leaf/30 bg-leaf/10 text-primary",
  error: "border-danger/30 bg-red-50 text-danger dark:bg-red-950/40",
  info: "border-border bg-card text-foreground",
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <motion.button
              key={t.id}
              onClick={() => dismiss(t.id)}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium shadow-lg ${colors[t.kind]}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{t.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
