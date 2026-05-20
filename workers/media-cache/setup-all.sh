#!/usr/bin/env bash
set -euo pipefail

echo "Media cache now uses D1 via MEDIA_DB plus KV via MEDIA_CACHE."
echo "Run: wrangler d1 execute tiko-media --file schema.sql"
echo "Then deploy with: wrangler deploy"
