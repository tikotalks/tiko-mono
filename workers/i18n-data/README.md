# Tiko i18n Data Worker

Cloudflare Worker that exposes Tiko translation data from Lezu project `project_a2a9847c-edbd-499e-874f-5a58c0cca80c`.

## Runtime

- Source of truth: Lezu (`https://api.lezu.app`)
- Auth: `LEZU_API_KEY` secret using `Authorization: ApiKey <key>`
- Project: `LEZU_PROJECT_ID` var, defaults to the Tiko Lezu project

## Routes

- `GET /keys`
- `GET /languages`
- `GET /translations`
- `GET /translations/:language`
- `GET /all`
- `GET /app/:appName`
- `POST /generate`
