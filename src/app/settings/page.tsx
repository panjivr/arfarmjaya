import { ModulePage } from "@/components/module-page";

export default function SettingsPage() {
  return (
    <ModulePage
      title="Settings"
      description="System configuration for storage, security, rate limiting, CSRF, secure cookies, S3 compatible object storage, and operational preferences."
      records={["S3 bucket configured", "CSRF protection enabled", "Rate limiting policy active"]}
      actions={["Update company", "Configure S3", "Rotate keys", "Set rate limit", "Manage backups"]}
    />
  );
}
