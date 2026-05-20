#!/usr/bin/env bash
set -euo pipefail

echo "Tiko workers now use Cloudflare D1/R2/KV and Lezu."
echo "Use each worker's wrangler.toml plus schema.sql for setup."
echo "Set LEZU_API_KEY for i18n workers with wrangler secret put LEZU_API_KEY."
