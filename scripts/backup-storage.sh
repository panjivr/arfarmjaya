#!/usr/bin/env bash
set -euo pipefail
# No xtrace: database URLs, object credentials and encryption keys stay private.
: "${DATABASE_BACKUP_URL:?Set a direct PostgreSQL connection URL}"
: "${BACKUP_ENCRYPTION_PASSWORD:?Set a strong independent backup encryption password}"
: "${R2_ACCOUNT_ID:?}"
: "${R2_BUCKET:?}"
: "${R2_BACKUP_BUCKET:?Use a separate private backup bucket}"
: "${AWS_ACCESS_KEY_ID:?}"
: "${AWS_SECRET_ACCESS_KEY:?}"
if [[ "$R2_BUCKET" == "$R2_BACKUP_BUCKET" ]]; then
  echo 'Backup bucket must differ from the attachment bucket.' >&2
  exit 1
fi
backup_tmp="$(mktemp -d)"
trap 'rm -rf "$backup_tmp"' EXIT
backup_stamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
backup_endpoint="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
# Match this image major to the production server; pg_dump must be >= server major.
backup_pg_image="${BACKUP_POSTGRES_IMAGE:-postgres:18}"
docker run --rm -e DATABASE_BACKUP_URL "$backup_pg_image" \
  sh -c 'exec pg_dump --format=custom --no-owner --no-acl --dbname="$DATABASE_BACKUP_URL"' \
  > "$backup_tmp/database.dump"
test -s "$backup_tmp/database.dump"
# Check that the archive can be listed before encryption/upload.
docker run --rm -i "$backup_pg_image" pg_restore --list < "$backup_tmp/database.dump" > /dev/null
printf '%s' "$BACKUP_ENCRYPTION_PASSWORD" | gpg --batch --yes --pinentry-mode loopback \
  --symmetric --cipher-algo AES256 --passphrase-fd 0 \
  --output "$backup_tmp/database.dump.gpg" "$backup_tmp/database.dump"
# Preserve attachments first. Content-addressed keys are immutable; no --delete.
aws s3 sync "s3://${R2_BUCKET}/attachments/" "s3://${R2_BACKUP_BUCKET}/attachments/" \
  --endpoint-url "$backup_endpoint" --region auto --only-show-errors
aws s3 cp "$backup_tmp/database.dump.gpg" "s3://${R2_BACKUP_BUCKET}/database/${backup_stamp}.dump.gpg" \
  --endpoint-url "$backup_endpoint" --region auto --only-show-errors
# Record an integrity digest. Retain the encryption password outside this account.
sha256sum "$backup_tmp/database.dump.gpg" | cut -d ' ' -f 1 > "$backup_tmp/sha256.txt"
aws s3 cp "$backup_tmp/sha256.txt" "s3://${R2_BACKUP_BUCKET}/database/${backup_stamp}.sha256" \
  --endpoint-url "$backup_endpoint" --region auto --only-show-errors
echo "Encrypted database backup and attachment mirror completed: ${backup_stamp}"
