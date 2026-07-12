import { ModulePage } from "@/components/module-page";

export default function SettingsPage() {
  return (
    <ModulePage
      title="Pengaturan"
      description="Konfigurasi sistem untuk storage, keamanan, rate limiting, CSRF, secure cookies, object storage kompatibel S3, dan preferensi operasional."
      records={["Bucket S3 terkonfigurasi", "Proteksi CSRF aktif", "Kebijakan rate limit aktif"]}
      actions={["Update perusahaan", "Konfigurasi S3", "Rotasi kunci", "Atur rate limit", "Kelola backup"]}
    />
  );
}
