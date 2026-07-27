# Cloudflare Workers, Neon, and R2 Hosting

Coin Archive will run its TanStack Start web application on Cloudflare Workers, use Neon as its managed PostgreSQL provider, and retain Cloudflare R2 for Surface Image object storage. This combines a supported server-rendered deployment target with managed PostgreSQL while preserving the existing R2 storage decision; the application will use the Cloudflare Workers-compatible deployment and database connection configuration.
