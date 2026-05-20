# Tiko i18n Translator Worker

Cloudflare Worker that delegates Tiko translations to Lezu project `project_a2a9847c-edbd-499e-874f-5a58c0cca80c`.

## Runtime

- Source of truth and translation provider: Lezu (`https://api.lezu.app`)
- Auth: `LEZU_API_KEY` secret using `Authorization: ApiKey <key>`
- Cache: `TRANSLATION_CACHE` KV namespace

## Routes

- `GET /` health check
- `POST /translate-direct` for direct text translation with cache
- `POST /` for keyed translation/import into the Tiko Lezu project
