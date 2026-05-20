# Worker Deployment

Deploy workers with Wrangler from each worker directory.

Required runtime configuration is declared in each `wrangler.toml`. D1 schemas are in worker-local `schema.sql` files and must be applied to the bound D1 database before deployment. Translation workers use Lezu and require `LEZU_API_KEY`.
