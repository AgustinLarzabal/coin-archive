import { defineConfig } from "drizzle-kit"
import { getDatabaseUrl } from "./src/env"

const databaseUrl = getDatabaseUrl()

export default defineConfig({
  schema: [
    "./src/schema/catalogue.ts",
    "./src/schema/coin.ts",
    "./src/schema/coin-reference.ts",
    "./src/schema/composition.ts",
    "./src/schema/distribution.ts",
    "./src/schema/issuer.ts",
    "./src/schema/ruler-group.ts",
    "./src/schema/ruler.ts",
    "./src/schema/coin-ruler.ts",
  ],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
