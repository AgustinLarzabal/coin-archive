import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { sql } from "drizzle-orm"

import { db } from "../client"
import { seedDatabase } from "../seed"

const migrationsFolder = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../migrations"
)

export async function resetAndSeedDatabase() {
  await db.execute(sql.raw("drop schema public cascade"))
  await db.execute(sql.raw("drop schema if exists drizzle cascade"))
  await db.execute(sql.raw("create schema public"))
  await migrate(db, { migrationsFolder })
  await seedDatabase()
}
