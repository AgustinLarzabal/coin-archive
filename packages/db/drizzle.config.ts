import { defineConfig } from "drizzle-kit"
import { getDatabaseUrl } from "./src/env"

const databaseUrl = getDatabaseUrl()

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
