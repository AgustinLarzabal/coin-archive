# Coin Archive Admin

This TanStack Start app uses the shared `@coin-archive/ui` components and theme.

## Adding components

To add components to your app, run the following command from the repository root:

```bash
pnpm dlx shadcn@latest add button -c apps/admin
```

This will place shared UI components in `packages/ui/src/components`.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@coin-archive/ui/components/button";
```
