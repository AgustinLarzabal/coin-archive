import { defineConfig } from "drizzle-kit"
import { getDatabaseUrl } from "./src/env"

const databaseUrl = getDatabaseUrl()

export default defineConfig({
  schema: [
    "./src/schema/account.ts",
    "./src/schema/catalogue.ts",
    "./src/schema/coin.ts",
    "./src/schema/coin-surface.ts",
    "./src/schema/coin-surface-engraver.ts",
    "./src/schema/coin-mint.ts",
    "./src/schema/coin-theme.ts",
    "./src/schema/coin-reference.ts",
    "./src/schema/composition.ts",
    "./src/schema/currency.ts",
    "./src/schema/distribution.ts",
    "./src/schema/edge.ts",
    "./src/schema/engraver.ts",
    "./src/schema/issuer.ts",
    "./src/schema/mint.ts",
    "./src/schema/maintenance-idempotency.ts",
    "./src/schema/orientation.ts",
    "./src/schema/rim.ts",
    "./src/schema/ruler-group.ts",
    "./src/schema/ruler.ts",
    "./src/schema/session.ts",
    "./src/schema/shape.ts",
    "./src/schema/surface-image-cleanup-failure.ts",
    "./src/schema/technique.ts",
    "./src/schema/coin-ruler.ts",
    "./src/schema/theme.ts",
    "./src/schema/user.ts",
    "./src/schema/verification.ts",
  ],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
