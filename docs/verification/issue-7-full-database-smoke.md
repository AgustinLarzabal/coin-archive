# Issue 7 Verification Notes

This slice verifies the clean local database smoke path from a fresh Docker volume through the web root route.

## Prerequisites

- Docker with `docker compose`
- `DATABASE_URL=postgresql://coin_archive:coin_archive@localhost:5432/coin_archive`

## Manual command sequence used

```bash
npm run db:reset
npm run db:start
npm run db:migrate
npm run db:seed
npm run build
cd apps/web
npm run dev -- --host 127.0.0.1
```

In a second shell, fetch `http://127.0.0.1:3000/` and confirm the root route renders the seeded Coin JSON array with `Seed Coin 10` through `Seed Coin 01`.

## Automated workspace command

```bash
npm run db:smoke
```

The smoke script runs the same local flow, fetches the root route automatically, verifies the seeded Coin JSON response, and resets the Docker volume during cleanup.
