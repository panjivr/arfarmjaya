"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Menampilkan dokumen pada lebar cetak aslinya lalu menyusutkannya agar pas di
 * lebar kolom, sehingga pratinjau tetap proporsional 1:1 seperti hasil cetak
 * tanpa melebarkan halaman. Saat penyusutannya besar (mis. di HP), tombol
 * perbesar memunculkan ukuran penuh dengan gulir mendatar di dalam kartu.
 */
export function ScaledPreview({ children, baseWidth = 1180 }: { children: React.ReactNode; baseWidth?: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState<number | undefined>(undefined);

  const scale = expanded ? 1 : fitScale;

  const measure = useCallback(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const fit = Math.min(1, outer.clientWidth / baseWidth);
    setFitScale(fit);
    setHeight(inner.offsetHeight * (expanded ? 1 : fit));
  }, [baseWidth, expanded]);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    measure();
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="relative min-w-0">
      {fitScale < 0.95 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="absolute right-2 top-2 z-10 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card/95 px-2.5 text-xs font-semibold shadow-sm backdrop-blur transition hover:bg-card"
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {expanded ? "Muat layar" : "Perbesar"}
        </button>
      )}
      <div
        ref={outerRef}
        className={cn("w-full min-w-0", expanded ? "overflow-x-auto" : "overflow-hidden")}
        style={{ height }}
      >
        <div ref={innerRef} style={{ width: baseWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
