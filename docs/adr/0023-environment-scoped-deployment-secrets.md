# Environment-Scoped Deployment Secrets

All deployment credentials, including Neon URLs, Google OAuth secrets, Better Auth secrets, R2 keys, and Cloudflare deployment tokens, will live only in separate GitHub staging and production environment secrets. Non-secret deployment settings may be versioned, but credentials will never be committed to the repository.
