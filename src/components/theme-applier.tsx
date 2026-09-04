"use client";

import { useEffect } from "react";
import { useUiStore } from "@/lib/store";

export function ThemeApplier() {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);
  return null;
}
