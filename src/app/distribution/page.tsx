import { ModulePage } from "@/components/module-page";

export default function DistributionPage() {
  return (
    <ModulePage
      title="Distribusi"
      description="Alur distribusi gudang dari picking, packing, loading, pengiriman, terkirim, sampai selesai."
      stages={["Gudang", "Picking", "Packing", "Loading", "Pengiriman", "Terkirim", "Selesai"]}
      records={["DO-260712-018 / Cabang Cibubur", "DO-260712-019 / Dapur Pusat", "DO-260711-088 / Toko retail"]}
      actions={["Buat pengiriman", "Tugaskan driver", "Cetak manifest", "Pantau status", "Konfirmasi terkirim"]}
    />
  );
}
