# shadcn/ui monorepo template

This is a TanStack Start monorepo template with shadcn/ui.

## Local PostgreSQL

Use the root `db:*` scripts to manage the local PostgreSQL 18 container:

```bash
pnpm db:start
pnpm db:stop
pnpm db:reset
```

Copy the root `.env.example` value into your local env file when the database package is added:

```bash
DATABASE_URL=postgresql://coin_archive:coin_archive@localhost:5432/coin_archive
```

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
