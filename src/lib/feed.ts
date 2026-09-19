/**
 * Katalog pakan lele yang umum dipakai peternak di Indonesia — merk, kode
 * produk, fase pemakaian, ukuran pelet, kadar protein, dan perkiraan harga.
 * Dipakai sebagai referensi pilihan pada input pakan harian & simulator.
 * Angka protein/harga bersifat perkiraan dan bisa berbeda antar-daerah/waktu.
 */
export type FeedPhase = "Benih" | "Pendederan" | "Pembesaran";

export type FeedProduct = {
  brand: string;
  code: string; // kode produk, mis. "PF-1000"
  phase: FeedPhase;
  pelletMm: string; // ukuran butiran, mis. "1 mm"
  proteinPct: number; // kadar protein (%)
  floating: boolean; // pelet apung / tenggelam
  pricePerKg: number; // perkiraan harga (Rp/kg)
};

export const FEED_CATALOG: FeedProduct[] = [
  // Hi-Pro-Vite (Central Proteina Prima) — paling umum untuk lele
  { brand: "Hi-Pro-Vite", code: "PF-500", phase: "Benih", pelletMm: "0,5 mm", proteinPct: 39, floating: true, pricePerKg: 22000 },
  { brand: "Hi-Pro-Vite", code: "PF-800", phase: "Benih", pelletMm: "0,8 mm", proteinPct: 39, floating: true, pricePerKg: 20000 },
  { brand: "Hi-Pro-Vite", code: "PF-1000", phase: "Pendederan", pelletMm: "1 mm", proteinPct: 39, floating: true, pricePerKg: 18500 },
  { brand: "Hi-Pro-Vite", code: "781-1", phase: "Pendederan", pelletMm: "1 mm", proteinPct: 31, floating: true, pricePerKg: 15500 },
  { brand: "Hi-Pro-Vite", code: "781-2", phase: "Pembesaran", pelletMm: "2 mm", proteinPct: 31, floating: true, pricePerKg: 14500 },
  { brand: "Hi-Pro-Vite", code: "781", phase: "Pembesaran", pelletMm: "3 mm", proteinPct: 30, floating: true, pricePerKg: 13800 },
  // Charoen Pokphand (CP)
  { brand: "CP (Pokphand)", code: "581", phase: "Benih", pelletMm: "0,8-1 mm", proteinPct: 39, floating: true, pricePerKg: 21000 },
  { brand: "CP (Pokphand)", code: "582", phase: "Pendederan", pelletMm: "1,5 mm", proteinPct: 32, floating: true, pricePerKg: 15000 },
  { brand: "CP (Pokphand)", code: "583", phase: "Pembesaran", pelletMm: "2-3 mm", proteinPct: 30, floating: true, pricePerKg: 14000 },
  // Matahari Sakti — Lele Pro (LP)
  { brand: "Matahari Sakti", code: "LP-1", phase: "Pendederan", pelletMm: "1 mm", proteinPct: 31, floating: true, pricePerKg: 14800 },
  { brand: "Matahari Sakti", code: "LP-2", phase: "Pembesaran", pelletMm: "2 mm", proteinPct: 30, floating: true, pricePerKg: 13800 },
  { brand: "Matahari Sakti", code: "LP-3", phase: "Pembesaran", pelletMm: "3 mm", proteinPct: 29, floating: true, pricePerKg: 13200 },
  // Cargill — Aquaxcel
  { brand: "Cargill", code: "Aquaxcel 7434", phase: "Pendederan", pelletMm: "1,5 mm", proteinPct: 32, floating: true, pricePerKg: 15200 },
  { brand: "Cargill", code: "Aquaxcel 7444", phase: "Pembesaran", pelletMm: "2-3 mm", proteinPct: 30, floating: true, pricePerKg: 14200 },
  // Gold Coin — Sinta
  { brand: "Gold Coin", code: "Sinta SPLA", phase: "Pembesaran", pelletMm: "2-3 mm", proteinPct: 30, floating: true, pricePerKg: 13600 },
];

export const FEED_BRANDS = Array.from(new Set(FEED_CATALOG.map((f) => f.brand)));

/** Rekomendasi produk pakan sesuai umur (hari) budidaya. */
export function suggestFeed(ageDays: number): FeedProduct {
  if (ageDays <= 10) return FEED_CATALOG.find((f) => f.code === "PF-800")!;
  if (ageDays <= 21) return FEED_CATALOG.find((f) => f.code === "PF-1000")!;
  if (ageDays <= 40) return FEED_CATALOG.find((f) => f.code === "781-1")!;
  if (ageDays <= 60) return FEED_CATALOG.find((f) => f.code === "781-2")!;
  return FEED_CATALOG.find((f) => f.code === "781")!;
}

export function findFeed(brand?: string, code?: string): FeedProduct | undefined {
  return FEED_CATALOG.find((f) => f.brand === brand && f.code === code) ?? FEED_CATALOG.find((f) => f.code === code);
}
