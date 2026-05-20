# Cloudflare Resource Inventory and Deployment Plan

Generated: 2026-05-20T06:36:58.333866+00:00

Scope: read-only inventory for Tiko clean rebuild across the primary me@sil.mt Cloudflare account and the older Silvandiepen@gmail.com account referenced by this repository. Data sources: Wrangler 4.88.0, Cloudflare API v4, repository `wrangler.toml`, `.dev.vars*`, and `.github/workflows` files. No Cloudflare resources were created, changed, or deleted.

## Executive summary
| Account | Account ID | Workers | D1 | R2 | KV | Queues | Pages | Worker custom domains | Zones |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Me@sil.mt's Account | 8cef251b5fdcf6c6f63db98b7aa49f9a | 38 | 27 | 45 | 9 | 2 | 36 | 41 | arevdata.com, bandli.mt, batsik.com, chikki.app, controv.com, emila.dev, emila-preview.dev, girk.dev, hakobs.com, lezu.app, open-icon.org, pietru.dev, skumize.com, stansil.com |
| Silvandiepen@gmail.com's Account | dc2b7d14a69351375cab6de9a13ddee9 | 14 | 3 | 5 | 7 | 1 | 13 | 5 | tikoapi.org, tikoapps.org, tikocdn.org, tiko.mt, tiko.talk, tikotalks.com |

Key findings:
- The Tiko monorepo worker configs currently target the Gmail account (`dc2b7d14a69351375cab6de9a13ddee9`) for most legacy/Tiko workers. Three older worker configs explicitly reference that account; the rest rely on configured/default account context.
- The primary account (`8cef251b...`) owns most newer Sil rebuild resources and many non-Tiko projects. It has far more Workers, Pages projects, D1 databases, and R2 buckets than the Gmail account.
- Existing Tiko-specific reusable resources are in the Gmail account: D1 `tiko-auth`, `tiko-db`; R2 `tiko-assets`, `tiko-tts-audio`, `user-media`, `media`; KV namespaces with `tiko-*` and production translation/cache names; Pages projects `tiko-*`; Workers `tiko-*`, `assets-upload`, `image-generation`, `tts-generation`, `user-media-upload`, etc.
- No Terraform or Pulumi IaC files were found in the repository. Deployment is through GitHub Actions and direct Wrangler scripts.

## Repository Cloudflare configuration

### Wrangler configs
| Path | Configured worker name | Account ID | Main | Compat date | Top routes | Top bindings | Environments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| workers/assets-upload/wrangler.toml | assets-upload | (implicit) | src/index.ts | 2024-01-15 |  | R2:ASSETS_R2_BUCKET->tiko-assets<br>Vars:workers_dev | development: name=assets-upload; routes=;  |
| workers/auth-service/wrangler.toml | tiko-auth-service | (implicit) | src/index.ts | 2024-01-17 | [{'pattern': 'auth.tikoapps.org/*', 'zone_name': 'tikoapps.org'}] | D1:AUTH_DB->tiko-auth<br>Vars:BETTER_AUTH_URL,COOKIE_DOMAIN,ALLOWED_APP_ORIGINS |  |
| workers/content-api/wrangler.toml | tiko-content-api | (implicit) | src/index.ts | 2024-01-01 |  | KV:CONTENT_CACHE->19e053c7a4c94f16a1ee4a436bfac34a<br>Vars:CACHE_TTL,SUPABASE_URL | staging: name=tiko-content-api; routes=[{'pattern': 'content-staging.tikoapi.org/*', 'zone_name': 'tikoapi.org'}];  |
| workers/i18n-data/wrangler.toml | i18n-data | (implicit) | src/index.ts | 2024-05-07 |  |  | production: name=i18n-data; routes=; Vars:ENVIRONMENT |
| workers/i18n-translator/wrangler.toml | tiko-i18n-translator | dc2b7d14a69351375cab6de9a13ddee9 | src/index.ts | 2024-01-17 |  |  | production: name=tiko-i18n-translator; routes=; KV:TRANSLATION_CACHE->b0220795e8734645b74887aa04f1e7e7 |
| workers/image-generation/wrangler.toml | image-generation | (implicit) | src/index.ts | 2024-01-01 |  | R2:MEDIA_BUCKET->media<br>R2:USER_MEDIA_BUCKET->user-media<br>Vars:ENVIRONMENT,SUPABASE_URL | production: name=image-generation; routes={'pattern': 'generate.tikocdn.org/*', 'zone_name': 'tikocdn.org'}; R2:MEDIA_BUCKET->media<br>R2:USER_MEDIA_BUCKET->user-media<br>Vars:ENVIRONMENT,SUPABASE_URL |
| workers/media-cache/wrangler.toml | media-cache | (implicit) | src/index.ts | 2024-01-15 |  | KV:MEDIA_CACHE->a26659698dbb44c48de3d06e100e5c78 | staging: name=media-cache-staging; routes=[{'pattern': 'staging-tikoapi.org/media/cache', 'zone_name': 'tikoapi.org'}]; KV:MEDIA_CACHE->da4fddfde76b49b189c859bcd3292975<br>production: name=media-cache; routes=[{'pattern': 'tikoapi.org/media/cache', 'zone_name': 'tikoapi.org'}]; KV:MEDIA_CACHE->REPLACE_WITH_PRODUCTION_KV_NAMESPACE_ID |
| workers/media-upload/wrangler.toml | tiko-media-upload | dc2b7d14a69351375cab6de9a13ddee9 | src/index.ts | 2024-01-17 |  | Vars: | production: name=tiko-media-upload; routes=[{'pattern': 'api.tikocdn.org/upload', 'zone_name': 'tikocdn.org'}, {'pattern': 'api.tikocdn.org/analyze', 'zone_name': 'tikocdn.org'}]; R2:R2_BUCKET->media |
| workers/report-issue/wrangler.toml | report-issue | (implicit) | src/index.ts | 2023-05-18 |  |  | production: name=report-issue; routes=; <br>development: name=report-issue-dev; routes=;  |
| workers/sentence-engine/wrangler.toml | tiko-sentence-engine | dc2b7d14a69351375cab6de9a13ddee9 | src/index.ts | 2024-08-02 |  |  | production: name=tiko-sentence-engine; routes=[{'pattern': 'tikoapi.org/sentence/*', 'zone_name': 'tikoapi.org'}];  |
| workers/tts-generation/wrangler.toml | tts-generation | (implicit) | src/index.ts | 2024-12-14 | [{'pattern': 'https://tts.tikoapi.org/*', 'zone_name': 'tikoapi.org'}] | R2:AUDIO_BUCKET->tiko-tts-audio<br>Vars:ENVIRONMENT | production: name=tts-generation; routes=; Vars:ENVIRONMENT |
| workers/user-media-upload/wrangler.toml | user-media-upload | (implicit) | src/index.ts | 2024-01-01 | [{'pattern': 'https://user-media.tikocdn.org/*', 'zone_name': 'tikocdn.org'}] | R2:USER_MEDIA_BUCKET->user-media | development: name=user-media-upload; routes=; Vars:ENVIRONMENT |
| workers/user-removal/wrangler.toml | user-removal | (implicit) | src/index.ts | 2023-12-01 |  | Vars:ENVIRONMENT | production: name=user-removal; routes={'pattern': 'tikoapi.org/user-removal/*', 'zone_name': 'tikoapi.org'}; KV:USER_REMOVAL_LOG->your_kv_namespace_id |

### Worker package deploy scripts
| Worker dir | Package | Relevant scripts |
| --- | --- | --- |
| workers/assets-upload | assets-upload-worker | dev: wrangler dev<br>deploy: wrangler deploy |
| workers/auth-service | @tiko/auth-service-worker | dev: wrangler dev<br>deploy: wrangler deploy<br>build: tsc<br>typecheck: tsc --noEmit |
| workers/content-api | @tiko/content-api-worker | dev: wrangler dev<br>deploy: wrangler deploy |
| workers/i18n-data | i18n-data-worker | deploy: wrangler deploy<br>dev: wrangler dev<br>build: tsc |
| workers/i18n-translator | @tiko/i18n-translator-worker | dev: wrangler dev src/index.ts<br>build: wrangler deploy src/index.ts --dry-run --outdir dist<br>deploy: wrangler deploy src/index.ts<br>typecheck: tsc --noEmit<br>lint: eslint src |
| workers/image-generation | @tiko/image-generation-worker | dev: wrangler dev<br>deploy: wrangler deploy |
| workers/media-cache | media-cache-worker | dev: wrangler dev<br>deploy: sh scripts/deploy.sh production<br>deploy:dev: sh scripts/deploy.sh development<br>deploy:staging: sh scripts/deploy.sh staging<br>deploy:production: sh scripts/deploy.sh production |
| workers/media-upload | @tiko/media-upload-worker | dev: wrangler dev src/index.ts<br>build: wrangler deploy src/index.ts --dry-run --outdir dist<br>deploy: wrangler deploy src/index.ts --env production<br>typecheck: tsc --noEmit<br>lint: eslint src |
| workers/report-issue | report-issue-worker | dev: wrangler dev<br>deploy: wrangler deploy<br>deploy:dev: wrangler deploy --env development<br>deploy:prod: wrangler deploy --env production |
| workers/sentence-engine | @tiko/sentence-engine-worker | dev: wrangler dev src/index.ts<br>build: wrangler deploy src/index.ts --dry-run --outdir dist<br>deploy: wrangler deploy src/index.ts<br>typecheck: tsc --noEmit<br>lint: eslint src |
| workers/tts-generation | @tiko/tts-generation-worker | dev: wrangler dev<br>deploy: wrangler deploy |
| workers/user-media-upload | @tiko/user-media-upload-worker | dev: wrangler dev<br>deploy: wrangler deploy |
| workers/user-removal | @tiko/user-removal-worker | dev: wrangler dev<br>deploy: wrangler deploy<br>build: tsc |

### Local dev vars files
Only key names are listed; values were intentionally not copied.
| File | Keys |
| --- | --- |
| workers/image-generation/.dev.vars | OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, ENVIRONMENT |
| workers/media-cache/.dev.vars.example | SUPABASE_URL, SUPABASE_SERVICE_KEY, DEPLOYMENT_VERSION |
| workers/user-media-upload/.dev.vars | SUPABASE_URL, SUPABASE_SERVICE_KEY |

### CI/CD and IaC
| File | Wrangler reference | Cloudflare token secret | Cloudflare account secret |
| --- | --- | --- | --- |
| .github/workflows/DEPLOYMENT_SETUP.md | wrangler | CLOUDFLARE_API_TOKEN |  |
| .github/workflows/deploy-apps.yml | wrangler | CLOUDFLARE_API_TOKEN |  |
| .github/workflows/deploy-tools.yml | wrangler | CLOUDFLARE_API_TOKEN | CLOUDFLARE_ACCOUNT_ID |
| .github/workflows/deploy-websites.yml | wrangler | CLOUDFLARE_API_TOKEN |  |
| .github/workflows/deploy-workers.yml | wrangler | CLOUDFLARE_API_TOKEN |  |
| .github/workflows/i18n-validation.yml |  |  |  |
| .github/workflows/ios-apps.yml |  |  |  |
| .github/workflows/reusable-check-environment.yml |  | CLOUDFLARE_API_TOKEN | CLOUDFLARE_ACCOUNT_ID |
| .github/workflows/reusable-determine-environment.yml |  |  |  |

- Terraform files found: none.
- Pulumi files found: none.
- Deployment workflows include reusable environment checks plus `deploy-apps.yml`, `deploy-tools.yml`, `deploy-websites.yml`, and `deploy-workers.yml`. Worker deployment uses Cloudflare API token/account secrets; app/tool/website deployments use Cloudflare Pages.

## Account: Me@sil.mt's Account (8cef251b5fdcf6c6f63db98b7aa49f9a)

### Workers
| Worker | Modified | Deployed from | Handlers | Bindings from deployed settings | Routes / custom domains |
| --- | --- | --- | --- | --- | --- |
| arev-api | 2026-03-24T15:16:35.37614Z | wrangler | fetch | plain_text:ACCESS_EMAIL_ADMIN_TO<br>plain_text:ACCESS_EMAIL_FROM<br>plain_text:ACCESS_EMAIL_REPLY_TO<br>ratelimit:ANON_API_RATE_LIMITER->4101<br>ratelimit:ANON_MAPS_RATE_LIMITER->4102<br>d1:API_ACCESS_DB->e1fa9f38-3c4b-4ea6-996a-cff934cb66a9<br>ratelimit:API_KEY_API_RATE_LIMITER->4103<br>ratelimit:API_KEY_MAPS_RATE_LIMITER->4104<br>plain_text:PUBLIC_API_ORIGIN<br>secret_text:RESEND_API_KEY<br>ratelimit:SIGNUP_RATE_LIMITER->4105 | api.arevdata.com |
| bandli-api-dev | 2026-05-19T21:08:17.714292Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | d1:DB->f7e45a2c-beb4-436e-9755-e38e1c1248c3<br>plain_text:ENVIRONMENT<br>plain_text:MAPBOX_KEY<br>r2_bucket:PHOTOS->bandli-photos-dev | dev-api.bandli.mt |
| batsik-api | 2025-10-08T20:45:18.772298Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | plain_text:APP_BASE_URL<br>plain_text:CONFIRM_URL_BASE<br>secret_text:RESEND_API_KEY<br>secret_text:RESEND_FROM<br>secret_text:SUPABASE_SERVICE_KEY<br>secret_text:SUPABASE_URL<br>plain_text:UNSUBSCRIBE_URL_BASE | api.batsik.com/*<br>subscribe.batsik.com/* |
| chikki-list-room | 2026-05-12T12:47:25.501363Z | wrangler | scheduled | d1:DB->9204f564-a601-4ce7-b631-4b12be68e66e<br>plain_text:INTERNAL_SECRET<br>durable_object_namespace:LIST_ROOM->157b67eba5c14c2eb97ccde60b9bb9bc |  |
| chikki-list-room-dev | 2026-05-19T09:42:34.70009Z | wrangler | scheduled | d1:DB->628b382c-3f04-40fa-a018-59cbc61bf6a8<br>plain_text:INTERNAL_SECRET<br>durable_object_namespace:LIST_ROOM->baec715bf0e7420ab57b12ecee85222e |  |
| emila-dev | 2026-05-19T10:52:16.954307Z | wrangler | fetch, email, scheduled | ai:AI<br>plain_text:AI_EDIT_FALLBACK_MODEL<br>plain_text:AI_EDIT_MODEL<br>plain_text:AI_MODEL<br>plain_text:AI_UTILITY_MODEL<br>plain_text:APP_BASE_URL<br>assets:ASSETS<br>browser:BROWSER<br>d1:DB->d95352a5-a76a-4987-bab1-611ab72ee0b6<br>plain_text:DEFAULT_CONTENT_WORKFLOW_FILE<br>plain_text:DEFAULT_PUBLISH_WORKFLOW_FILE<br>plain_text:GITHUB_APP_ID<br>secret_text:GITHUB_APP_PRIVATE_KEY<br>plain_text:GITHUB_APP_SLUG<br>plain_text:INBOUND_EMAIL_ADDRESS<br>plain_text:OUTBOUND_EMAIL_ADDRESS<br>plain_text:OUTBOUND_EMAIL_NAME<br>secret_text:PAYPAL_CLIENT_ID<br>plain_text:PAYPAL_ENVIRONMENT<br>secret_text:PAYPAL_SECRET<br>plain_text:PDF_APP_BASE_URL<br>r2_bucket:PDF_BUCKET->emila-pdf-dev<br>plain_text:PDF_INBOUND_EMAIL_ADDRESS<br>plain_text:PDF_OUTBOUND_EMAIL_ADDRESS<br>plain_text:PDF_OUTBOUND_EMAIL_NAME<br>plain_text:PREVIEW_BASE_DOMAIN<br>r2_bucket:PREVIEW_BUCKET->emila-preview-dev<br>secret_text:RESEND_API_KEY<br>secret_text:WORKFLOW_CALLBACK_TOKEN | *.emila-preview.dev/*<br>admin.dev.emila.dev<br>cdn.dev.emila.dev<br>dashboard.dev.emila.dev<br>dev.emila.dev<br>docs.dev.emila.dev<br>jobs.dev.emila.dev<br>pdf.dev.emila.dev |
| emila-prod | 2026-05-08T18:51:44.946906Z | wrangler | fetch, email, scheduled | ai:AI<br>plain_text:AI_EDIT_FALLBACK_MODEL<br>plain_text:AI_EDIT_MODEL<br>plain_text:AI_MODEL<br>plain_text:AI_UTILITY_MODEL<br>plain_text:APP_BASE_URL<br>assets:ASSETS<br>browser:BROWSER<br>d1:DB->76081728-4194-4eb8-bd38-d52e4e89e0c0<br>plain_text:DEFAULT_CONTENT_WORKFLOW_FILE<br>plain_text:DEFAULT_PUBLISH_WORKFLOW_FILE<br>plain_text:GITHUB_APP_ID<br>secret_text:GITHUB_APP_PRIVATE_KEY<br>plain_text:GITHUB_APP_SLUG<br>plain_text:INBOUND_EMAIL_ADDRESS<br>plain_text:OUTBOUND_EMAIL_ADDRESS<br>plain_text:OUTBOUND_EMAIL_NAME<br>secret_text:PAYPAL_CLIENT_ID<br>plain_text:PAYPAL_ENVIRONMENT<br>secret_text:PAYPAL_SECRET<br>plain_text:PDF_APP_BASE_URL<br>r2_bucket:PDF_BUCKET->emila-pdf<br>plain_text:PDF_INBOUND_EMAIL_ADDRESS<br>plain_text:PDF_OUTBOUND_EMAIL_ADDRESS<br>plain_text:PDF_OUTBOUND_EMAIL_NAME<br>plain_text:PREVIEW_BASE_DOMAIN<br>r2_bucket:PREVIEW_BUCKET->emila-preview<br>secret_text:RESEND_API_KEY<br>secret_text:WORKFLOW_CALLBACK_TOKEN | admin.emila.dev<br>cdn.emila.dev<br>dashboard.emila.dev<br>docs.emila.dev<br>emila.dev<br>jobs.emila.dev<br>pdf.emila.dev<br>www.emila.dev |
| emila-staging | 2026-04-29T20:46:51.298524Z | wrangler | fetch, email, scheduled | ai:AI<br>plain_text:AI_EDIT_FALLBACK_MODEL<br>plain_text:AI_EDIT_MODEL<br>plain_text:AI_MODEL<br>plain_text:AI_UTILITY_MODEL<br>plain_text:APP_BASE_URL<br>assets:ASSETS<br>browser:BROWSER<br>d1:DB->9c912e47-6219-4a3e-bebf-214870261750<br>plain_text:DEFAULT_CONTENT_WORKFLOW_FILE<br>plain_text:DEFAULT_PUBLISH_WORKFLOW_FILE<br>plain_text:GITHUB_APP_ID<br>secret_text:GITHUB_APP_PRIVATE_KEY<br>plain_text:GITHUB_APP_SLUG<br>plain_text:INBOUND_EMAIL_ADDRESS<br>plain_text:OUTBOUND_EMAIL_ADDRESS<br>plain_text:OUTBOUND_EMAIL_NAME<br>secret_text:PAYPAL_CLIENT_ID<br>plain_text:PAYPAL_ENVIRONMENT<br>secret_text:PAYPAL_SECRET<br>plain_text:PREVIEW_BASE_DOMAIN<br>r2_bucket:PREVIEW_BUCKET->emila-preview-staging<br>secret_text:RESEND_API_KEY<br>plain_text:SIGNUP_ALLOWED_DOMAINS<br>secret_text:WORKFLOW_CALLBACK_TOKEN | *.staging.emila-preview.dev/*<br>admin.staging.emila.dev<br>cdn.staging.emila.dev<br>dashboard.staging.emila.dev<br>docs.staging.emila.dev<br>jobs.staging.emila.dev<br>staging.emila.dev |
| girk-sites | 2026-05-04T21:15:10.322504Z | wrangler | fetch | assets:ASSETS | *.girk.dev/*<br>girk.dev/*<br>www.girk.dev/* |
| girk-sites-dev | 2026-05-19T09:24:23.567428Z | wrangler | fetch | assets:ASSETS<br>plain_text:GIRK_ENVIRONMENT | dev.girk.dev/* |
| kod-backend | 2026-05-19T08:04:11.096581Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | plain_text:ACCESS_TOKEN_TTL_SECONDS<br>plain_text:ARGON2_ITERATIONS<br>plain_text:ARGON2_MEMORY_KIB<br>plain_text:ARGON2_PARALLELISM<br>d1:DB->18a5b608-d431-44e6-9d4c-dd1cd0c6feca<br>secret_text:ENCRYPTION_KEY<br>secret_text:JWT_SECRET<br>secret_text:REFRESH_TOKEN_PEPPER<br>plain_text:REFRESH_TOKEN_TTL_SECONDS<br>r2_bucket:RELEASES->kod-releases | kodapi.hakobs.com/* |
| kod-backend-dev | 2026-05-19T08:04:16.443356Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | plain_text:ACCESS_TOKEN_TTL_SECONDS<br>plain_text:ARGON2_ITERATIONS<br>plain_text:ARGON2_MEMORY_KIB<br>plain_text:ARGON2_PARALLELISM<br>d1:DB->350739f4-5a35-40fd-87e8-3c7308e066d3<br>secret_text:ENCRYPTION_KEY<br>secret_text:JWT_SECRET<br>plain_text:PUBLIC_API_ORIGIN<br>secret_text:REFRESH_TOKEN_PEPPER<br>plain_text:REFRESH_TOKEN_TTL_SECONDS<br>r2_bucket:RELEASES->kod-releases-dev | dev-kodapi.hakobs.com/* |
| lezin-api | 2026-05-06T10:20:39.169917Z | wrangler | fetch | r2_bucket:RELEASES->lezin-releases | lezin-api.hakobs.com |
| lezin-api-dev | 2026-05-19T09:27:50.432454Z | wrangler | fetch | r2_bucket:RELEASES->lezin-releases-dev | api.dev.lezin.hakobs.com |
| lezu | 2026-05-15T07:09:01.522023Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | ai:AI<br>plain_text:API_VERSION<br>plain_text:APP_HOSTS<br>assets:ASSETS<br>d1:AUTH_DB->e367c3cf-7c62-473a-9475-93e9d2411d70<br>secret_text:AUTH_MIGRATION_TOKEN<br>secret_text:AUTH_SECRET<br>plain_text:AUTH_URL<br>kv_namespace:BUNDLE_CACHE->52873b07e6854174a69bfa3ebaaec10c<br>secret_text:ENCRYPTION_MASTER_KEY<br>plain_text:ENVIRONMENT<br>kv_namespace:GLOBAL_TM_CACHE->b0a7b1212a6745f08f72b45960f29c72<br>plain_text:NODE_ENV<br>r2_bucket:RELEASES_BUCKET->lezu-release-artifacts<br>secret_text:RESEND_API_KEY<br>kv_namespace:TRANSLATION_CACHE->41b23028b96e4ba2865a6d6d339fbbb9 |  |
| lezu-platform-api-development | 2026-05-19T07:59:22.236646Z | wrangler | fetch, queue | ai:AI<br>plain_text:APP_URL<br>kv_namespace:BUNDLE_CACHE->c76bc53aaa4b4b47a16164fccdc0278d<br>d1:DB->d1938725-6919-4d46-ac37-5b65d27b7fb3<br>plain_text:EMAIL_FROM<br>plain_text:ENVIRONMENT<br>r2_bucket:FILES_BUCKET->lezu-platform-development-files<br>plain_text:PAYPAL_BRAND_NAME<br>secret_text:PAYPAL_CLIENT_ID<br>secret_text:PAYPAL_CLIENT_SECRET<br>plain_text:PAYPAL_ENVIRONMENT<br>secret_text:RESEND_API_KEY<br>queue:TRANSLATION_JOBS->lezu-platform-development-translation-jobs<br>plain_text:VERSION<br>plain_text:WORKERS_AI_MODEL | api.dev.lezu.app |
| lezu-platform-api-production | 2026-05-15T07:45:29.426602Z | wrangler | fetch, queue | ai:AI<br>plain_text:APP_URL<br>kv_namespace:BUNDLE_CACHE->52873b07e6854174a69bfa3ebaaec10c<br>d1:DB->6112f629-848c-40bb-85d9-9fc011ac89b1<br>plain_text:EMAIL_FROM<br>plain_text:ENVIRONMENT<br>r2_bucket:FILES_BUCKET->lezu-platform-production-files<br>plain_text:PAYPAL_BRAND_NAME<br>secret_text:PAYPAL_CLIENT_ID<br>secret_text:PAYPAL_CLIENT_SECRET<br>plain_text:PAYPAL_ENVIRONMENT<br>secret_text:RESEND_API_KEY<br>queue:TRANSLATION_JOBS->lezu-platform-production-translation-jobs<br>plain_text:VERSION<br>plain_text:WORKERS_AI_MODEL | api.lezu.app |
| moluna-worker | 2025-12-15T13:49:53.770449Z | wrangler | fetch, scheduled | d1:DB->155d1c97-671f-42c5-8d51-3074cd617fb3<br>secret_text:OPENAI_API_KEY<br>r2_bucket:R2_BUCKET->moluna-media<br>plain_text:R2_PUBLIC_HOST<br>plain_text:SESSION_SECRET<br>secret_text:SORA_API_KEY | api.moluna.hakobs.com |
| open-icon-api | 2026-03-30T13:54:42.000795Z | wrangler | fetch | assets:ASSETS | api.open-icon.org |
| open-icon-api-dev | 2026-05-19T07:41:45.275572Z | wrangler | fetch | assets:ASSETS | api.dev.open-icon.org |
| paggi-api | 2026-05-07T16:30:47.969868Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | r2_bucket:BUILDS->paggi-builds<br>d1:DB->9826895c-2665-443a-b5c7-74354b5964ec<br>r2_bucket:DOWNLOADS->paggi-downloads<br>plain_text:ENVIRONMENT<br>secret_text:JWT_SECRET<br>json:routes<br>r2_bucket:SITES->paggi-sites<br>r2_bucket:UPLOADS->paggi-uploads | paggi-api.hakobs.com |
| paggi-api-dev | 2026-05-19T07:49:37.8521Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | r2_bucket:BUILDS->paggi-builds-dev<br>d1:DB->b01ba2a1-f635-4ad3-bdb9-d930b50b32c8<br>r2_bucket:DOWNLOADS->paggi-downloads-dev<br>plain_text:ENVIRONMENT<br>secret_text:JWT_SECRET<br>r2_bucket:SITES->paggi-sites-dev<br>plain_text:SITES_BASE_URL<br>r2_bucket:UPLOADS->paggi-uploads-dev | api.dev.paggi.hakobs.com |
| paggi-sites | 2026-05-04T17:02:17.79011Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | d1:DB->9826895c-2665-443a-b5c7-74354b5964ec<br>r2_bucket:SITES->paggi-sites |  |
| paggi-sites-dev | 2026-05-19T07:49:48.267613Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | d1:DB->b01ba2a1-f635-4ad3-bdb9-d930b50b32c8<br>r2_bucket:SITES->paggi-sites-dev | sites.dev.paggi.hakobs.com |
| paggu-dev | 2026-05-19T12:15:25.152606Z | wrangler | fetch | plain_text:PAGGU_CHECKOUT_MODE |  |
| pietru-api | 2026-05-19T04:50:52.733798Z | wrangler | fetch, email | secret_text:DASHBOARD_URL<br>d1:DB->b10d5417-73b1-4000-be98-ebdb1a070275<br>secret_text:ENCRYPTION_KEY<br>plain_text:INBOUND_EMAIL_ADDRESS<br>secret_text:JWT_SECRET<br>kv_namespace:KV->ccf2e217b60d44e4bd6aeff05aaa52b6<br>plain_text:OUTBOUND_EMAIL_ADDRESS<br>plain_text:OUTBOUND_EMAIL_NAME<br>secret_text:PIETRU_SES_ACCESS_KEY_ID<br>secret_text:PIETRU_SES_REGION<br>secret_text:PIETRU_SES_SECRET_ACCESS_KEY<br>r2_bucket:STORAGE->pietru-storage<br>secret_text:SYSTEM_EMAIL_API_KEY<br>secret_text:SYSTEM_EMAIL_FROM | api.pietru.dev |
| pietru-api-dev | 2026-05-19T09:31:27.58214Z | wrangler | fetch, email | plain_text:DASHBOARD_URL<br>d1:DB->7803d90e-b6d4-4ab7-b5d3-f1e54f5b4ea8<br>secret_text:ENCRYPTION_KEY<br>plain_text:INBOUND_EMAIL_ADDRESS<br>secret_text:JWT_SECRET<br>kv_namespace:KV->e3d55d9571454c9f8e2f84f7e67a0b2b<br>plain_text:OUTBOUND_EMAIL_ADDRESS<br>plain_text:OUTBOUND_EMAIL_NAME<br>secret_text:PIETRU_SES_ACCESS_KEY_ID<br>plain_text:PIETRU_SES_REGION<br>secret_text:PIETRU_SES_SECRET_ACCESS_KEY<br>r2_bucket:STORAGE->pietru-storage-dev<br>secret_text:SYSTEM_EMAIL_API_KEY<br>plain_text:SYSTEM_EMAIL_FROM | api.dev.pietru.dev |
| planner-api | 2026-01-15T21:24:29.932838Z | wrangler | fetch | d1:DB->74323fef-6261-4517-99ad-71c69580e7e4<br>plain_text:FRONTEND_URL<br>secret_text:GOOGLE_CLIENT_ID<br>secret_text:GOOGLE_CLIENT_SECRET<br>secret_text:GOOGLE_REDIRECT_URI | planner-api.hakobs.com |
| r2-admin | 2026-01-14T13:31:15.406599Z | wrangler | fetch | secret_text:ADMIN_EMAIL<br>secret_text:ADMIN_PASSWORD<br>plain_text:ALLOWED_ORIGINS<br>secret_text:AUTH_SECRET<br>r2_bucket:BUCKET->hakobs<br>d1:DB->aa535b94-3b1f-452b-b9c9-80ce631e359d | content.hakobs.com |
| skumize-queue | 2025-09-20T10:15:33.910957Z | wrangler | fetch | secret_text:SUPABASE_SERVICE_ROLE_KEY<br>secret_text:SUPABASE_URL |  |
| skumize-queue-production | 2025-09-20T10:15:38.247843Z | wrangler | fetch, queue, scheduled |  |  |
| stansil-api | 2025-11-04T12:04:41.179583Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | plain_text:ALLOW_BLOB_RESPONSES<br>plain_text:ALLOWED_ORIGINS<br>plain_text:CONVERT_BASE<br>plain_text:ENABLE_IMAGE_PARENT<br>plain_text:ENABLE_MOCK_PAYMENTS<br>plain_text:IMAGES_HOST<br>secret_text:JWT_SECRET<br>plain_text:MAX_IMAGES_PER_REQUEST<br>secret_text:OPENAI_API_KEY<br>r2_bucket:R2->stansil-images<br>plain_text:STRIPE_PRICES<br>plain_text:STRIPE_SECRET_KEY<br>secret_text:STRIPE_WEBHOOK_SECRET<br>plain_text:SUPABASE_ANON_KEY<br>secret_text:SUPABASE_SECRET_KEY<br>secret_text:SUPABASE_SERVICE_ROLE<br>plain_text:SUPABASE_URL<br>secret_text:WORKER_SECRET | api.stansil.com<br>image.stansil.com |
| stansil-api-staging | 2025-10-24T07:26:19.967929Z | dash_template | fetch |  | api-staging.stansil.com |
| stansil-credits | 2025-09-10T08:14:46.543159Z | wrangler | fetch | secret_text:ENCRYPTION_KEY<br>secret_text:SUPABASE_SECRET_KEY<br>secret_text:SUPABASE_URL<br>secret_text:WORKER_SECRET |  |
| stansil-image | 2025-09-10T08:14:55.248214Z | wrangler | fetch | secret_text:ENCRYPTION_KEY<br>secret_text:OPENAI_API_KEY<br>secret_text:SUPABASE_SECRET_KEY<br>secret_text:SUPABASE_URL<br>secret_text:WORKER_SECRET |  |
| stansil-process | 2025-09-10T08:15:08.0799Z | wrangler | fetch | secret_text:REPLICATE_API_TOKEN<br>secret_text:SUPABASE_SECRET_KEY<br>secret_text:SUPABASE_URL<br>secret_text:WORKER_SECRET |  |
| toaxt-api | 2026-05-02T21:26:50.469054Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | plain_text:ACCESS_TOKEN_TTL_SECONDS<br>plain_text:CORS_ORIGINS<br>d1:DB->5a3f1c9a-a9d0-476f-97c2-e77b7b3a59c0<br>plain_text:JWT_AUDIENCE<br>plain_text:JWT_ISSUER<br>secret_text:JWT_SECRET<br>plain_text:REFRESH_TOKEN_TTL_DAYS | toaxt-api.hakobs.com |
| tusk-api | 2026-05-02T21:07:44.920072Z | wrangler | fetch | r2_bucket:RELEASES->tusk-releases | tuskapi.hakobs.com/* |

### D1 databases
| Name | UUID | Created | Tables | Size |
| --- | --- | --- | --- | --- |
| dokki-db | e57ead2b-266d-4b71-bdaf-2d40d9ca9e57 | 2026-05-19T14:01:00.084Z | 0 | 64.0 KiB |
| agent-release-notes | ef30185e-4883-4a21-9b09-7418005f8dd5 | 2026-05-19T11:57:45.920Z | 0 | 284.0 KiB |
| bandli-dev | f7e45a2c-beb4-436e-9755-e38e1c1248c3 | 2026-05-19T10:10:46.707Z | 0 | 168.0 KiB |
| bandli | 970dd5dc-7c88-4e9b-af99-573241799dd3 | 2026-05-19T10:10:44.230Z | 0 | 88.0 KiB |
| kod-dev | 350739f4-5a35-40fd-87e8-3c7308e066d3 | 2026-05-19T07:42:38.597Z | 0 | 104.0 KiB |
| paggi-db-dev | b01ba2a1-f635-4ad3-bdb9-d930b50b32c8 | 2026-05-19T07:05:55.881Z | 0 | 140.0 KiB |
| flikki-dev-db | 04775b66-2a10-481a-a05b-0f663d6dbf08 | 2026-05-19T07:04:39.593Z | 0 | 64.0 KiB |
| chikki-db-dev | 628b382c-3f04-40fa-a018-59cbc61bf6a8 | 2026-05-19T06:42:44.577Z | 0 | 92.0 KiB |
| flikki-db | a7a630d2-b0ef-46d7-91bc-f536ad990905 | 2026-05-13T07:35:55.234Z | 0 | 60.0 KiB |
| pietru-dev | 7803d90e-b6d4-4ab7-b5d3-f1e54f5b4ea8 | 2026-05-08T14:32:06.303Z | 0 | 276.0 KiB |
| pietru-production | b10d5417-73b1-4000-be98-ebdb1a070275 | 2026-05-08T14:31:38.820Z | 0 | 312.0 KiB |
| chikki-db | 9204f564-a601-4ce7-b631-4b12be68e66e | 2026-05-07T17:02:44.626Z | 0 | 96.0 KiB |
| paggi-db | 9826895c-2665-443a-b5c7-74354b5964ec | 2026-05-04T06:14:13.604Z | 0 | 568.0 KiB |
| toaxt-production | 5a3f1c9a-a9d0-476f-97c2-e77b7b3a59c0 | 2026-05-02T21:10:46.293Z | 0 | 140.0 KiB |
| kod-production | 18a5b608-d431-44e6-9d4c-dd1cd0c6feca | 2026-05-01T09:14:55.861Z | 0 | 136.0 KiB |
| emila-db-dev | d95352a5-a76a-4987-bab1-611ab72ee0b6 | 2026-04-30T07:21:19.511Z | 0 | 396.0 KiB |
| lezu-platform-production | 6112f629-848c-40bb-85d9-9fc011ac89b1 | 2026-04-27T07:31:56.680Z | 0 | 11.2 MiB |
| lezu-platform-development | d1938725-6919-4d46-ac37-5b65d27b7fb3 | 2026-04-27T07:31:52.933Z | 0 | 2.0 MiB |
| lezu-dev-db | 549e30e4-2ce0-4ffb-bfa1-b82a30f62d1a | 2026-04-14T18:34:57.131Z | 0 | 156.0 KiB |
| lezu-db-staging | da8bc9ce-5cd2-40cb-aa61-46c31419d353 | 2026-04-12T15:12:27.839Z | 0 | 348.0 KiB |
| emila-db-staging | 9c912e47-6219-4a3e-bebf-214870261750 | 2026-04-12T15:12:21.649Z | 0 | 264.0 KiB |
| arev-api-access | e1fa9f38-3c4b-4ea6-996a-cff934cb66a9 | 2026-03-24T08:45:46.374Z | 0 | 140.0 KiB |
| edit-db | 76081728-4194-4eb8-bd38-d52e4e89e0c0 | 2026-03-16T13:06:46.357Z | 0 | 1.2 MiB |
| lezu-db | e367c3cf-7c62-473a-9475-93e9d2411d70 | 2026-03-10T08:36:08.609Z | 0 | 628.0 KiB |
| planner-db | 74323fef-6261-4517-99ad-71c69580e7e4 | 2026-01-15T16:04:49.993Z | 0 | 480.0 KiB |
| hakobs-db | aa535b94-3b1f-452b-b9c9-80ce631e359d | 2026-01-14T10:15:43.398Z | 0 | 24.0 KiB |
| moluna-db | 155d1c97-671f-42c5-8d51-3074cd617fb3 | 2025-12-11T09:33:08.889Z | 0 | 2.2 MiB |

### R2 buckets
| Bucket | Created | Usage |
| --- | --- | --- |
| agent-drive | 2026-05-19T18:28:41.818Z | not returned by list API |
| bandli-photos | 2026-05-19T10:10:49.113Z | not returned by list API |
| bandli-photos-dev | 2026-05-19T10:10:51.128Z | not returned by list API |
| dokki-documents | 2026-05-19T14:01:08.779Z | not returned by list API |
| emila-pdf | 2026-04-29T22:11:23.194Z | not returned by list API |
| emila-pdf-dev | 2026-04-30T07:21:19.461Z | not returned by list API |
| emila-pdf-staging | 2026-04-30T07:19:48.235Z | not returned by list API |
| emila-preview | 2026-03-20T09:55:01.404Z | not returned by list API |
| emila-preview-dev | 2026-04-30T07:21:19.284Z | not returned by list API |
| emila-preview-staging | 2026-04-12T15:12:22.409Z | not returned by list API |
| flikki-images | 2026-05-13T07:36:13.633Z | not returned by list API |
| flikki-images-dev | 2026-05-19T07:04:44.112Z | not returned by list API |
| hakobs | 2026-01-14T10:11:48.061Z | not returned by list API |
| hakobs-supabase | 2025-10-07T11:59:46.228Z | not returned by list API |
| icons | 2025-09-10T07:16:15.601Z | not returned by list API |
| kod-releases | 2026-05-01T15:12:49.780Z | not returned by list API |
| kod-releases-dev | 2026-05-19T07:42:46.434Z | not returned by list API |
| lezin-releases | 2026-05-06T10:10:03.425Z | not returned by list API |
| lezin-releases-dev | 2026-05-19T08:04:01.192Z | not returned by list API |
| lezu-ci-25599062596-1-files | 2026-05-09T10:40:13.607Z | not returned by list API |
| lezu-ci-25599996786-1-files | 2026-05-09T11:29:29.425Z | not returned by list API |
| lezu-ci-25601691621-1-files | 2026-05-09T12:59:16.237Z | not returned by list API |
| lezu-ci-25602107942-1-files | 2026-05-09T13:20:52.827Z | not returned by list API |
| lezu-dev-storage | 2026-04-14T18:35:00.528Z | not returned by list API |
| lezu-platform-development-files | 2026-04-27T07:32:00.892Z | not returned by list API |
| lezu-platform-production-files | 2026-04-27T07:32:04.751Z | not returned by list API |
| lezu-release-artifacts | 2025-09-15T06:12:54.981Z | not returned by list API |
| lezu-release-artifacts-dev | 2026-05-01T18:07:57.804Z | not returned by list API |
| lezu-release-artifacts-staging | 2026-04-12T15:12:29.750Z | not returned by list API |
| moluna-media | 2025-12-11T09:41:05.284Z | not returned by list API |
| paggi-builds | 2026-05-04T06:14:41.450Z | not returned by list API |
| paggi-builds-dev | 2026-05-19T07:06:17.026Z | not returned by list API |
| paggi-downloads | 2026-05-04T21:48:40.073Z | not returned by list API |
| paggi-downloads-dev | 2026-05-19T07:06:20.100Z | not returned by list API |
| paggi-sites | 2026-05-04T06:14:44.489Z | not returned by list API |
| paggi-sites-dev | 2026-05-19T07:06:18.752Z | not returned by list API |
| paggi-uploads | 2026-05-04T06:14:38.889Z | not returned by list API |
| paggi-uploads-dev | 2026-05-19T07:06:15.136Z | not returned by list API |
| pietru-storage | 2026-05-08T14:32:10.596Z | not returned by list API |
| pietru-storage-dev | 2026-05-19T07:17:09.165Z | not returned by list API |
| presstizzi | 2026-02-12T15:47:45.485Z | not returned by list API |
| presstizzi-dev | 2026-02-12T15:48:40.020Z | not returned by list API |
| stansil-images | 2025-10-23T16:53:19.881Z | not returned by list API |
| stansil-images-staging | 2025-10-24T07:24:04.735Z | not returned by list API |
| tusk-releases | 2026-05-02T08:01:16.612Z | not returned by list API |

### KV namespaces
| Title | ID | Key count |
| --- | --- | --- |
| BUNDLE_CACHE | 1fbbae3d8f2140c1a78be7d0c75dfc12 | not returned by namespace list API |
| lezu-translation-cache-prod | 41b23028b96e4ba2865a6d6d339fbbb9 | not returned by namespace list API |
| lezu-bundle-cache-prod | 52873b07e6854174a69bfa3ebaaec10c | not returned by namespace list API |
| lezu-translation-cache-staging | 59c81415b2fe439c866acf737b7ae795 | not returned by namespace list API |
| lezu-global-tm-cache-prod | b0a7b1212a6745f08f72b45960f29c72 | not returned by namespace list API |
| lezu-bundle-cache-staging | c76bc53aaa4b4b47a16164fccdc0278d | not returned by namespace list API |
| CACHE | ccf2e217b60d44e4bd6aeff05aaa52b6 | not returned by namespace list API |
| lezu-global-tm-cache-staging | d80de9f756484b6fbab0228706ec3b65 | not returned by namespace list API |
| pietru-cache-dev | e3d55d9571454c9f8e2f84f7e67a0b2b | not returned by namespace list API |

### Queues
| Name | ID | Created | Modified | Producers | Consumers |
| --- | --- | --- | --- | --- | --- |
| lezu-platform-development-translation-jobs | 712d925f3f7b4ca18e07c79b4508a662 | 2026-04-27T07:32:10.313304Z | 2026-04-27T07:32:10.313304Z | [{'script': 'lezu-platform-api-development', 'type': 'worker'}] | [{'script': 'lezu-platform-api-development', 'settings': {'batch_size': 10, 'max_retries': 3, 'max_wait_time_ms': 5000, 'retry_delay': 0}, 'consumer_id': '2236b06b33d741c280be9d9670b6456e', 'type': 'worker'}] |
| lezu-platform-production-translation-jobs | 7af3e6962e0645b48ab8b28bca8d92ff | 2026-04-27T07:32:14.324384Z | 2026-04-27T07:32:14.324384Z | [{'script': 'lezu-platform-api-production', 'type': 'worker'}] | [{'script': 'lezu-platform-api-production', 'settings': {'batch_size': 10, 'max_retries': 3, 'max_wait_time_ms': 5000, 'retry_delay': 0}, 'consumer_id': '9482ccdf049144ea8cd37e3584aeeb35', 'type': 'worker'}] |

### Pages projects
| Project | Domains | Source | Production branch | Created | Pages subdomain |
| --- | --- | --- | --- | --- | --- |
| bandli | bandli-avh.pages.dev, bandli.mt, dev.bandli.mt, www.bandli.mt | direct/upload | development | 2026-05-19T10:17:26.112766Z | bandli-avh.pages.dev |
| dokki | dokki.pages.dev | direct/upload | main | 2026-05-19T14:34:14.555239Z | dokki.pages.dev |
| flikki-dev | flikki-dev.pages.dev, dev.flikki.hakobs.com | direct/upload | development | 2026-05-19T07:08:48.476543Z | flikki-dev.pages.dev |
| lezu-platform-translate | lezu-platform-translate.pages.dev, translate-dev.lezu.app, translate.lezu.app | direct/upload | main | 2026-04-27T09:59:41.880573Z | lezu-platform-translate.pages.dev |
| pietru-docs-dev | pietru-docs-dev.pages.dev, docs.dev.pietru.dev | direct/upload | development | 2026-05-19T07:16:25.604006Z | pietru-docs-dev.pages.dev |
| lezu-platform-website | lezu-platform-website.pages.dev, dev.lezu.app, lezu.app, www.lezu.app | direct/upload | main | 2026-04-27T09:59:41.273482Z | lezu-platform-website.pages.dev |
| kod-web | kod-web.pages.dev, dev.kod.hakobs.com, kod.hakobs.com | direct/upload | main | 2026-05-01T11:10:21.046437Z | kod-web.pages.dev |
| chikki-dev | chikki-dev.pages.dev, dev.chikki.app | direct/upload | development | 2026-05-19T06:45:49.97086Z | chikki-dev.pages.dev |
| pietru-marketing-dev | pietru-marketing-dev.pages.dev, dev.pietru.dev | direct/upload | development | 2026-05-19T07:16:20.830653Z | pietru-marketing-dev.pages.dev |
| pietru-dashboard-dev | pietru-dashboard-dev.pages.dev, app.dev.pietru.dev | direct/upload | development | 2026-05-19T07:16:23.361744Z | pietru-dashboard-dev.pages.dev |
| lezin | lezin.pages.dev, dev.lezin.hakobs.com, lezin.hakobs.com | direct/upload | main | 2026-05-06T08:12:03.444185Z | lezin.pages.dev |
| controv | controv.pages.dev, controv.com, dev.controv.com, www.controv.com | direct/upload | main | 2026-05-14T08:46:02.001146Z | controv.pages.dev |
| lezu-platform-status | lezu-platform-status.pages.dev, status-dev.lezu.app | direct/upload | main | 2026-05-02T21:00:22.536875Z | lezu-platform-status.pages.dev |
| lezu-platform-dashboard | lezu-platform-dashboard.pages.dev, dashboard-dev.lezu.app, dashboard.lezu.app | direct/upload | main | 2026-04-27T09:59:42.162941Z | lezu-platform-dashboard.pages.dev |
| lezu-platform-docs | lezu-platform-docs.pages.dev, docs-dev.lezu.app, docs.lezu.app | direct/upload | main | 2026-04-27T09:59:42.83542Z | lezu-platform-docs.pages.dev |
| paggi-dev | paggi-dev.pages.dev, dev.paggi.hakobs.com | direct/upload | development | 2026-05-19T07:05:40.106126Z | paggi-dev.pages.dev |
| open-icon-org-dev | open-icon-org-dev.pages.dev, dev.open-icon.org | direct/upload | development | 2026-05-19T07:11:09.066226Z | open-icon-org-dev.pages.dev |
| nizel-docs | nizel-docs.pages.dev, dev.nizel.hakobs.com, nizel.hakobs.com | direct/upload | main | 2026-05-04T15:13:47.455535Z | nizel-docs.pages.dev |
| paggi | paggi-4g7.pages.dev, paggi.hakobs.com | direct/upload | main | 2026-05-04T06:16:12.115561Z | paggi-4g7.pages.dev |
| flikki | flikki.pages.dev, flikki.hakobs.com | direct/upload | main | 2026-05-13T07:38:04.149292Z | flikki.pages.dev |
| open-icon-org | open-icon-org.pages.dev, open-icon.org | direct/upload | master | 2026-03-24T17:04:27.753123Z | open-icon-org.pages.dev |
| hakobs-web | hakobs-web.pages.dev, dev.hakobs.com, hakobs.com, www.hakobs.com | direct/upload | main | 2026-05-02T21:30:31.331744Z | hakobs-web.pages.dev |
| pietru-marketing | pietru-marketing.pages.dev, pietru.dev | direct/upload | main | 2026-05-08T14:32:23.405272Z | pietru-marketing.pages.dev |
| pietru-dashboard | pietru-dashboard.pages.dev, app.pietru.dev | direct/upload | main | 2026-05-08T14:32:17.744885Z | pietru-dashboard.pages.dev |
| chikki | chikki-4ho.pages.dev, chikki.app | direct/upload | main | 2026-05-07T17:05:28.233565Z | chikki-4ho.pages.dev |
| pietru-docs | pietru-docs.pages.dev, docs.pietru.dev | direct/upload | main | 2026-05-11T20:54:08.059251Z | pietru-docs.pages.dev |
| tusk-web | tusk-web.pages.dev, tusk.hakobs.com | direct/upload | main | 2026-05-02T07:51:41.999451Z | tusk-web.pages.dev |
| toaxt-web | toaxt-web.pages.dev, toaxt.hakobs.com | direct/upload | main | 2026-05-02T21:20:52.869531Z | toaxt-web.pages.dev |
| arevdata-docs | arevdata-docs.pages.dev, arevdata.com | direct/upload | main | 2026-03-20T16:59:33.428988Z | arevdata-docs.pages.dev |
| planner-web | planner-web-3oj.pages.dev, planner.hakobs.com | direct/upload | master | 2026-01-15T15:58:06.2051Z | planner-web-3oj.pages.dev |
| moluna | moluna.pages.dev, moluna.hakobs.com | direct/upload | master | 2025-12-11T16:53:34.774099Z | moluna.pages.dev |
| stansil-page | stansil-page.pages.dev, stansil.com, www.stansil.com | direct/upload | main | 2025-10-23T17:49:17.368751Z | stansil-page.pages.dev |
| stansil-page-staging | stansil-page-staging.pages.dev, staging.stansil.com | direct/upload | main | 2025-10-24T07:28:04.817692Z | stansil-page-staging.pages.dev |
| batsik-dashboard | batsik-dashboard.pages.dev, app.batsik.com | direct/upload | master | 2025-10-08T18:47:00.654287Z | batsik-dashboard.pages.dev |
| batsik-marketing | batsik-marketing.pages.dev, batsik.com, www.batsik.com | direct/upload | master | 2025-10-08T18:46:56.943752Z | batsik-marketing.pages.dev |
| skumize-marketing | skumize-marketing.pages.dev, skumize.com, www.skumize.com | direct/upload | main | 2025-09-25T15:58:10.966262Z | skumize-marketing.pages.dev |

### Worker custom domains
| Hostname | Service | Environment | Zone | Enabled |
| --- | --- | --- | --- | --- |
| image.stansil.com | stansil-api | production | stansil.com | True |
| api.stansil.com | stansil-api | production | stansil.com | True |
| api-staging.stansil.com | stansil-api-staging | production | stansil.com | True |
| api.moluna.hakobs.com | moluna-worker | production | hakobs.com | True |
| content.hakobs.com | r2-admin | production | hakobs.com | True |
| planner-api.hakobs.com | planner-api | production | hakobs.com | True |
| api.arevdata.com | arev-api | production | arevdata.com | True |
| api.open-icon.org | open-icon-api | production | open-icon.org | True |
| staging.emila.dev | emila-staging | production | emila.dev | True |
| cdn.staging.emila.dev | emila-staging | production | emila.dev | True |
| admin.staging.emila.dev | emila-staging | production | emila.dev | True |
| dashboard.staging.emila.dev | emila-staging | production | emila.dev | True |
| docs.staging.emila.dev | emila-staging | production | emila.dev | True |
| jobs.staging.emila.dev | emila-staging | production | emila.dev | True |
| toaxt-api.hakobs.com | toaxt-api | production | hakobs.com | True |
| paggi-api.hakobs.com | paggi-api | production | hakobs.com | True |
| lezin-api.hakobs.com | lezin-api | production | hakobs.com | True |
| emila.dev | emila-prod | production | emila.dev | True |
| cdn.emila.dev | emila-prod | production | emila.dev | True |
| admin.emila.dev | emila-prod | production | emila.dev | True |
| dashboard.emila.dev | emila-prod | production | emila.dev | True |
| jobs.emila.dev | emila-prod | production | emila.dev | True |
| docs.emila.dev | emila-prod | production | emila.dev | True |
| pdf.emila.dev | emila-prod | production | emila.dev | True |
| www.emila.dev | emila-prod | production | emila.dev | True |
| api.pietru.dev | pietru-api | production | pietru.dev | True |
| api.lezu.app | lezu-platform-api-production | production | lezu.app | True |
| api.dev.open-icon.org | open-icon-api-dev | production | open-icon.org | True |
| api.dev.paggi.hakobs.com | paggi-api-dev | production | hakobs.com | True |
| sites.dev.paggi.hakobs.com | paggi-sites-dev | production | hakobs.com | True |
| api.dev.lezu.app | lezu-platform-api-development | production | lezu.app | True |
| api.dev.lezin.hakobs.com | lezin-api-dev | production | hakobs.com | True |
| api.dev.pietru.dev | pietru-api-dev | production | pietru.dev | True |
| dev.emila.dev | emila-dev | production | emila.dev | True |
| cdn.dev.emila.dev | emila-dev | production | emila.dev | True |
| admin.dev.emila.dev | emila-dev | production | emila.dev | True |
| dashboard.dev.emila.dev | emila-dev | production | emila.dev | True |
| docs.dev.emila.dev | emila-dev | production | emila.dev | True |
| jobs.dev.emila.dev | emila-dev | production | emila.dev | True |
| pdf.dev.emila.dev | emila-dev | production | emila.dev | True |
| dev-api.bandli.mt | bandli-api-dev | production | bandli.mt | True |

### Zone worker routes
| Zone | Route pattern | Worker script |
| --- | --- | --- |
| batsik.com | api.batsik.com/* | batsik-api |
| batsik.com | subscribe.batsik.com/* | batsik-api |
| emila-preview.dev | *.staging.emila-preview.dev/* | emila-staging |
| emila-preview.dev | *.emila-preview.dev/* | emila-dev |
| girk.dev | dev.girk.dev/* | girk-sites-dev |
| girk.dev | *.girk.dev/* | girk-sites |
| girk.dev | www.girk.dev/* | girk-sites |
| girk.dev | girk.dev/* | girk-sites |
| hakobs.com | kodapi.hakobs.com/* | kod-backend |
| hakobs.com | tuskapi.hakobs.com/* | tusk-api |
| hakobs.com | dev-kodapi.hakobs.com/* | kod-backend-dev |

## Account: Silvandiepen@gmail.com's Account (dc2b7d14a69351375cab6de9a13ddee9)

### Workers
| Worker | Modified | Deployed from | Handlers | Bindings from deployed settings | Routes / custom domains |
| --- | --- | --- | --- | --- | --- |
| assets-upload | 2025-08-23T12:26:52.586481Z | wrangler | fetch | r2_bucket:ASSETS_R2_BUCKET->tiko-assets<br>secret_text:SUPABASE_SECRET<br>secret_text:SUPABASE_SERVICE_KEY<br>secret_text:SUPABASE_URL<br>json:workers_dev | assets.tikoapi.org/* |
| i18n-data | 2025-08-21T09:22:47.770716Z | wrangler | fetch | secret_text:SUPABASE_SERVICE_KEY<br>secret_text:SUPABASE_URL |  |
| i18n-data-production | 2025-08-21T09:23:24.066576Z | wrangler | fetch | plain_text:ENVIRONMENT<br>secret_text:SUPABASE_SERVICE_KEY<br>secret_text:SUPABASE_URL |  |
| image-generation | 2025-08-13T05:21:20.759587Z | wrangler | fetch | plain_text:ENVIRONMENT<br>r2_bucket:MEDIA_BUCKET->media<br>secret_text:OPENAI_API_KEY<br>secret_text:SUPABASE_SERVICE_KEY<br>plain_text:SUPABASE_URL<br>r2_bucket:USER_MEDIA_BUCKET->user-media | generate.tikocdn.org<br>generate.tikocdn.org/* |
| lezu-api | 2025-09-12T14:23:14.200417Z | wrangler | get, post, put, delete, options, patch, all, on, use, router, getPath, _basePath, routes, errorHandler, onError, notFound, fetch, request, fire, route, basePath, mount | plain_text:API_VERSION<br>plain_text:NODE_ENV<br>plain_text:STRIPE_AGENCY_PRICE_ID<br>plain_text:STRIPE_BASIC_PRICE_ID<br>plain_text:STRIPE_MAX_PRICE_ID |  |
| tiko-auth-service | 2026-03-10T09:25:17.875275Z | wrangler | fetch | plain_text:ALLOWED_APP_ORIGINS<br>d1:AUTH_DB->dd37ed38-751c-46c4-866d-73294974e33b<br>secret_text:AUTH_GOOGLE_CLIENT_ID<br>secret_text:AUTH_GOOGLE_CLIENT_SECRET<br>secret_text:BETTER_AUTH_SECRET<br>plain_text:BETTER_AUTH_URL<br>plain_text:COOKIE_DOMAIN | auth.tikoapps.org/* |
| tiko-content-api | 2025-09-06T04:15:16.441522Z | wrangler | fetch | plain_text:CACHE_TTL<br>kv_namespace:CONTENT_CACHE->19e053c7a4c94f16a1ee4a436bfac34a<br>secret_text:SUPABASE_SECRET<br>plain_text:SUPABASE_URL | content.tikoapi.org |
| tiko-i18n-translator-production | 2026-03-17T14:35:18.21299Z | wrangler | fetch | secret_text:OPENAI_API_KEY<br>secret_text:SUPABASE_SERVICE_KEY<br>secret_text:SUPABASE_URL<br>kv_namespace:TRANSLATION_CACHE->b0220795e8734645b74887aa04f1e7e7 | tikoapi.org/translate |
| tiko-media-upload | 2025-08-02T18:11:44.478725Z | wrangler | fetch |  |  |
| tiko-media-upload-production | 2026-03-17T14:36:21.399783Z | wrangler | fetch | secret_text:OPENAI_API_KEY<br>r2_bucket:R2_BUCKET->media | api.tikocdn.org/analyze<br>api.tikocdn.org/upload |
| tiko-sentence-engine-production | 2025-08-29T10:53:14.066596Z | wrangler | fetch | secret_text:OPENAI_API_KEY<br>secret_text:SUPABASE_SERVICE_KEY<br>secret_text:SUPABASE_URL | tikoapi.org/sentence/* |
| tiko-upload-worker | 2025-07-24T07:56:24.077808Z | quick_editor | fetch | secret_text:OPENAI_API_KEY<br>r2_bucket:R2_BUCKET->media<br>secret_text:TINYPNG_API_KEY | api.tikocdn.org<br>upload-worker.tikocdn.org |
| tts-generation | 2025-08-14T20:56:29.078169Z | wrangler | fetch | r2_bucket:AUDIO_BUCKET->tiko-tts-audio<br>plain_text:ENVIRONMENT<br>secret_text:OPENAI_API_KEY<br>secret_text:SUPABASE_SERVICE_KEY<br>secret_text:SUPABASE_URL | https://tts.tikoapi.org/*<br>tts.tikoapi.org |
| user-media-upload | 2025-08-12T11:49:11.679541Z | wrangler | fetch | secret_text:SUPABASE_SERVICE_KEY<br>secret_text:SUPABASE_URL<br>r2_bucket:USER_MEDIA_BUCKET->user-media | https://user-media.tikocdn.org/* |

### D1 databases
| Name | UUID | Created | Tables | Size |
| --- | --- | --- | --- | --- |
| dislist-db | 66f9fd13-4b0f-4430-9b9b-1abe4a633c3c | 2026-05-06T12:48:26.382Z | 0 | 104.0 KiB |
| tiko-auth | dd37ed38-751c-46c4-866d-73294974e33b | 2026-03-10T08:44:43.052Z | 0 | 12.0 KiB |
| tiko-db | f99b61ae-6a78-4670-bb9c-cdc4f634264a | 2026-03-10T08:41:37.662Z | 0 | 12.0 KiB |

### R2 buckets
| Bucket | Created | Usage |
| --- | --- | --- |
| lezu-platform-production-files | 2026-05-10T15:28:50.913Z | not returned by list API |
| media | 2025-07-23T11:36:17.546Z | not returned by list API |
| tiko-assets | 2025-08-18T11:11:19.043Z | not returned by list API |
| tiko-tts-audio | 2025-08-14T20:42:45.163Z | not returned by list API |
| user-media | 2025-08-11T09:14:43.885Z | not returned by list API |

### KV namespaces
| Title | ID | Key count |
| --- | --- | --- |
| tiko-content-api-CONTENT_CACHE | 19e053c7a4c94f16a1ee4a436bfac34a | not returned by namespace list API |
| GLOBAL_TM_CACHE_PROD | 480553da4f074346b4d4dc37c393121a | not returned by namespace list API |
| BUNDLE_CACHE_PROD | 4b840fd9e18b433687e73368bfbcee14 | not returned by namespace list API |
| TRANSLATION_CACHE_PROD | 6b6e7cd89a964b7cba996e22fb5ee68a | not returned by namespace list API |
| media-cache-MEDIA_CACHE_preview | a26659698dbb44c48de3d06e100e5c78 | not returned by namespace list API |
| tiko-i18n-translator-TRANSLATION_CACHE | b0220795e8734645b74887aa04f1e7e7 | not returned by namespace list API |
| media-cache-staging-staging-MEDIA_CACHE | da4fddfde76b49b189c859bcd3292975 | not returned by namespace list API |

### Queues
| Name | ID | Created | Modified | Producers | Consumers |
| --- | --- | --- | --- | --- | --- |
| lezu-platform-production-translation-jobs | c647a8132dcf4fb8bd90a2c63db3982c | 2026-05-10T15:29:24.403787Z | 2026-05-10T15:29:24.403787Z | [] | [] |

### Pages projects
| Project | Domains | Source | Production branch | Created | Pages subdomain |
| --- | --- | --- | --- | --- | --- |
| chikki | chikki.pages.dev | direct/upload | main | 2026-05-07T09:37:28.218028Z | chikki.pages.dev |
| dislist | dislist.pages.dev, dislist.hakobs.com | direct/upload | main | 2026-05-06T12:49:06.959115Z | dislist.pages.dev |
| tiko-type | tiko-type.pages.dev, type.tikoapps.org | direct/upload | master | 2025-08-03T05:57:05.502136Z | tiko-type.pages.dev |
| tiko-todo | tiko-todo.pages.dev, todo.tikoapps.org | direct/upload | master | 2025-08-03T05:57:08.549632Z | tiko-todo.pages.dev |
| tiko-cards | tiko-cards.pages.dev, cards.tikoapps.org | direct/upload | master | 2025-08-03T05:56:51.738203Z | tiko-cards.pages.dev |
| tiko-yes-no | tiko-yes-no.pages.dev, yes-no.tikoapps.org, yesno.tikoapps.org | direct/upload | master | 2025-08-03T05:48:46.600842Z | tiko-yes-no.pages.dev |
| tiko-timer | tiko-timer.pages.dev, timer.tikoapps.org | direct/upload | master | 2025-08-03T05:45:56.240364Z | tiko-timer.pages.dev |
| tiko-radio | tiko-radio.pages.dev | direct/upload | master | 2025-08-03T05:56:57.669599Z | tiko-radio.pages.dev |
| tiko-marketing | tiko-marketing.pages.dev, tiko.mt, tikotalks.com, www.tikotalks.com | direct/upload | master | 2025-08-03T09:05:03.07159Z | tiko-marketing.pages.dev |
| tiko-media | tiko-media.pages.dev, media.tiko.mt, media.tikotalks.com | direct/upload | master | 2025-08-08T07:34:05.073624Z | tiko-media.pages.dev |
| tiko-sequence | tiko-sequence.pages.dev, sequence.tikoapps.org | direct/upload | master | 2025-08-19T08:31:55.65094Z | tiko-sequence.pages.dev |
| tiko-ui-docs | tiko-ui-docs.pages.dev | direct/upload | master | 2025-08-03T09:05:12.621847Z | tiko-ui-docs.pages.dev |
| tiko-admin | tiko-admin.pages.dev, admin.tikoapps.org | direct/upload | master | 2025-08-03T05:31:42.370101Z | tiko-admin.pages.dev |

### Worker custom domains
| Hostname | Service | Environment | Zone | Enabled |
| --- | --- | --- | --- | --- |
| upload-worker.tikocdn.org | tiko-upload-worker | production | tikocdn.org | True |
| api.tikocdn.org | tiko-upload-worker | production | tikocdn.org | True |
| content.tikoapi.org | tiko-content-api | production | tikoapi.org | True |
| generate.tikocdn.org | image-generation | production | tikocdn.org | True |
| tts.tikoapi.org | tts-generation | production | tikoapi.org | True |

### Zone worker routes
| Zone | Route pattern | Worker script |
| --- | --- | --- |
| tikoapi.org | tikoapi.org/sentence/* | tiko-sentence-engine-production |
| tikoapi.org | assets.tikoapi.org/* | assets-upload |
| tikoapi.org | https://tts.tikoapi.org/* | tts-generation |
| tikoapi.org | tikoapi.org/translate | tiko-i18n-translator-production |
| tikoapps.org | auth.tikoapps.org/* | tiko-auth-service |
| tikocdn.org | api.tikocdn.org/analyze | tiko-media-upload-production |
| tikocdn.org | api.tikocdn.org/upload | tiko-media-upload-production |
| tikocdn.org | https://user-media.tikocdn.org/* | user-media-upload |
| tikocdn.org | generate.tikocdn.org/* | image-generation |

## Reuse vs create for Tiko clean rebuild

| Resource area | Reuse candidate | Create / replace | Rationale |
| --- | --- | --- | --- |
| Accounts | Prefer primary account for the clean rebuild unless compatibility with existing Tiko domains/assets requires Gmail ownership during migration. | Create new dev/prod resources in a single chosen account before cutover. | Current ownership is split; clean rebuild should avoid more cross-account bindings. |
| Workers | Existing Gmail workers can be referenced for behavior and bindings; do not mutate them during rebuild. | New worker names should be environment-qualified, e.g. `tiko-api-dev`, `tiko-api`, `tiko-content-api-dev`, `tiko-content-api`. | Avoid ambiguity between production legacy names and rebuild deployments. |
| D1 | `tiko-db` and `tiko-auth` are existing production/legacy data stores. Reuse only if migration plan explicitly requires in-place compatibility. | Create fresh rebuild databases such as `tiko-platform-dev` and `tiko-platform-production`, then migrate/import deliberately. | Clean rebuild should have reversible migrations and avoid accidental writes to legacy data. |
| R2 | Existing `tiko-assets`, `tiko-tts-audio`, `user-media`, and `media` hold legacy/user content. Reuse for read-only migration/source of truth. | Create environment-separated buckets, e.g. `tiko-assets-dev`, `tiko-assets-production`, `tiko-user-media-dev`, `tiko-user-media-production`. | R2 buckets have no environment namespace by default; names must carry environment. |
| KV | Existing content/cache/translation namespaces can seed new caches but should not be shared between dev/prod rebuilds. | Create `tiko-content-cache-dev/prod`, `tiko-translation-cache-dev/prod`, `tiko-global-tm-cache-dev/prod`, etc. | Cache poisoning or mixed environments are hard to debug. |
| Queues | Existing translation job queues are Lezu/Tiko-adjacent; avoid sharing unless the worker protocol is identical. | Create environment-specific queues, e.g. `tiko-translation-jobs-dev` and `tiko-translation-jobs-production`. | Queues couple producer/consumer contracts tightly. |
| Pages | Existing `tiko-*` Pages projects in Gmail are legacy deploy targets. | For rebuild, use dev projects/domains first: `tiko-dev` or per-app `tiko-<app>-dev`; production only after Sil approval. | Matches Sil development flow; keeps production stable. |

## Recommended naming conventions

- Account: choose one canonical account for rebuild resources; document any temporary cross-account dependency explicitly.
- Workers: `<project>-<service>-<env>` for non-production and `<project>-<service>` or `<project>-<service>-production` for production, but be consistent across all services. Suggested: `tiko-api-dev`, `tiko-api-production`, `tiko-content-api-dev`, `tiko-content-api-production`.
- D1: `<project>-<domain>-<env>`, e.g. `tiko-app-dev`, `tiko-app-production`, `tiko-auth-dev`, `tiko-auth-production`.
- R2: `<project>-<data-kind>-<env>`, e.g. `tiko-assets-dev`, `tiko-assets-production`, `tiko-user-media-dev`, `tiko-user-media-production`.
- KV: `<project>-<cache-kind>-<env>`, e.g. `tiko-content-cache-dev`, `tiko-content-cache-production`.
- Queues: `<project>-<job-kind>-<env>`, e.g. `tiko-translation-jobs-dev`, `tiko-translation-jobs-production`.
- Pages: `tiko-<app>-dev` for dev previews and `tiko-<app>` for production. Use `dev.<domain>` for dev review URLs when a domain is configured.

## Deployment workflow documentation

Current repository workflow:
1. GitHub Actions determine branch/environment through reusable workflow files in `.github/workflows`.
2. Apps/tools/websites deploy to Cloudflare Pages through the app/tool/website deployment workflows.
3. Standalone Workers under `workers/*` deploy through `deploy-workers.yml` or local package scripts using Wrangler.
4. Required GitHub secrets include `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; worker-specific third-party keys are configured as Wrangler secrets or local `.dev.vars` for development.
5. Manual local deploy pattern in docs is `cd workers/<worker-name> && pnpm install && wrangler deploy --env production` or the package-level `pnpm --filter <package> deploy`.

Recommended rebuild workflow:
1. Keep integration work on `development`; use task branches off `development` for larger parallel changes. Do not promote to production/main without Sil approval.
2. Define all rebuild bindings in versioned `wrangler.toml` files; keep real secrets out of `[vars]` and use Wrangler/GitHub secrets.
3. Create dev resources first and deploy to public dev URLs (`dev.<domain>` or Pages dev domains) for review.
4. Run schema migrations/imports against dev D1/R2/KV, verify data, then create production resources from the same naming scheme.
5. Only after approval, point production custom domains/routes to the new Pages projects/workers.

## Verification checklist

- [x] Both Cloudflare accounts accessible to Wrangler/API inventoried.
- [x] Workers listed with deployed settings bindings and route/custom-domain references where returned by API.
- [x] D1 databases listed with IDs, table count field, and file sizes returned by API.
- [x] R2 buckets listed; object/storage usage was not returned by the list API and was marked as unavailable rather than guessed.
- [x] KV namespaces listed; key counts were not returned by namespace list API and were marked as unavailable rather than guessed.
- [x] Pages projects listed per account, including domains and source/branch fields returned by API.
- [x] Queues listed per account.
- [x] Custom domains and zone worker routes listed.
- [x] Repository `wrangler.toml`, `.dev.vars*`, GitHub Actions, and IaC presence checked.
