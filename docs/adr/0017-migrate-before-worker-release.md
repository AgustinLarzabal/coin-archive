# Migrate Before Worker Release

Each staging or production release will apply pending database migrations before releasing the new Cloudflare Worker. If a migration fails, the deployment fails. This keeps application code and the PostgreSQL schema compatible without manual production database operations.
