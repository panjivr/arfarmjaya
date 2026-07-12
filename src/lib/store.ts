"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "karyawan";

export type SessionUser = {
  name: string;
  role: Role;
  label: string;
};

type StockMovement = {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  note: string;
  actor: string;
  createdAt: string;
};

type UiState = {
  sidebarOpen: boolean;
  commandOpen: boolean;
  user: SessionUser | null;
  stockMovements: StockMovement[];
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  login: (role: Role) => void;
  logout: () => void;
  recordStockOut: (movement: Omit<StockMovement, "id" | "actor" | "createdAt">) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      commandOpen: false,
      user: null,
      stockMovements: [],
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setCommandOpen: (open) => set({ commandOpen: open }),
      login: (role) =>
        set({
          user:
            role === "admin"
              ? { name: "Admin Utama", role: "admin", label: "Akses penuh" }
              : { name: "Karyawan Gudang", role: "karyawan", label: "Barang keluar" },
        }),
      logout: () => set({ user: null, sidebarOpen: false, commandOpen: false }),
      recordStockOut: (movement) => {
        const actor = get().user?.name ?? "Pengguna";
        set((state) => ({
          stockMovements: [
            {
              ...movement,
              id: crypto.randomUUID(),
              actor,
              createdAt: new Date().toISOString(),
            },
            ...state.stockMovements,
          ],
        }));
      },
    }),
    {
      name: "arfarmjaya-session",
      partialize: (state) => ({
        user: state.user,
        stockMovements: state.stockMovements,
      }),
    },
  ),
);
