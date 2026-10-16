import { fileURLToPath } from "node:url"

import { sql } from "drizzle-orm"
import { migrate } from "drizzle-orm/node-postgres/migrator"

import { createDatabase } from "./connection.js"
import { readCoinSeed, seedCoins } from "./seed.js"

const INVALID_DATABASE_URL_MESSAGE =
  "A valid local PostgreSQL DATABASE_URL with a database name is required"
const INVALID_STAGING_DATABASE_URL_MESSAGE =
  "A valid direct Neon PostgreSQL DATABASE_URL with a database name is required"

const PERMITTED_RESET_HOSTS = new Set(["localhost", "127.0.0.1"])
const DIRECT_NEON_HOST_PATTERN = /^ep-[a-z0-9-]+(?:\.[a-z0-9-]+)+\.neon\.tech$/
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url))

export interface LocalResetTarget {
  databaseName: string
  databaseUrl: string
}

export interface StagingResetTarget {
  databaseName: string
  databaseUrl: string
  hostname: string
}

export function parseLocalResetTarget(
  databaseUrl: string | undefined
): LocalResetTarget {
  if (!databaseUrl) {
    throw new Error(INVALID_DATABASE_URL_MESSAGE)
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(databaseUrl)
  } catch {
    throw new Error(INVALID_DATABASE_URL_MESSAGE)
  }

  if (
    (parsedUrl.protocol !== "postgres:" &&
      parsedUrl.protocol !== "postgresql:") ||
    parsedUrl.pathname === "/" ||
    !parsedUrl.pathname.startsWith("/")
  ) {
    throw new Error(INVALID_DATABASE_URL_MESSAGE)
  }

  let databaseName: string
  try {
    databaseName = decodeURIComponent(parsedUrl.pathname.slice(1))
  } catch {
    throw new Error(INVALID_DATABASE_URL_MESSAGE)
  }

  if (!databaseName || databaseName.includes("/")) {
    throw new Error(INVALID_DATABASE_URL_MESSAGE)
  }

  if (
    parsedUrl.searchParams.has("host") ||
    !PERMITTED_RESET_HOSTS.has(parsedUrl.hostname)
  ) {
    throw new Error(
      "Database reset is permitted only for localhost or 127.0.0.1"
    )
  }

  return { databaseName, databaseUrl }
}

export function parseStagingResetTarget(
  databaseUrl: string | undefined,
  confirmation: string | undefined
): StagingResetTarget {
  if (!databaseUrl) {
    throw new Error(INVALID_STAGING_DATABASE_URL_MESSAGE)
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(databaseUrl)
  } catch {
    throw new Error(INVALID_STAGING_DATABASE_URL_MESSAGE)
  }

  if (
    (parsedUrl.protocol !== "postgres:" &&
      parsedUrl.protocol !== "postgresql:") ||
    parsedUrl.pathname === "/" ||
    !parsedUrl.pathname.startsWith("/")
  ) {
    throw new Error(INVALID_STAGING_DATABASE_URL_MESSAGE)
  }

  let databaseName: string
  try {
    databaseName = decodeURIComponent(parsedUrl.pathname.slice(1))
  } catch {
    throw new Error(INVALID_STAGING_DATABASE_URL_MESSAGE)
  }

  if (!databaseName || databaseName.includes("/")) {
    throw new Error(INVALID_STAGING_DATABASE_URL_MESSAGE)
  }

  const { hostname } = parsedUrl
  if (
    parsedUrl.searchParams.has("host") ||
    !DIRECT_NEON_HOST_PATTERN.test(hostname) ||
    hostname.split(".")[0]?.endsWith("-pooler")
  ) {
    throw new Error(
      "Staging reset is permitted only for a direct Neon hostname without a host query override"
    )
  }

  const targetIdentity = `${hostname}/${databaseName}`
  if (confirmation !== targetIdentity) {
    throw new Error(
      `Staging reset requires --confirm ${JSON.stringify(targetIdentity)}`
    )
  }

  return { databaseName, databaseUrl, hostname }
}

export async function resetLocalDatabase(databaseUrl: string | undefined) {
  const target = parseLocalResetTarget(databaseUrl)

  console.log(
    `Resetting local database ${JSON.stringify(target.databaseName)} before migrating and seeding.`
  )

  await rebuildDatabase(target.databaseUrl)
}

export async function resetStagingDatabase(
  databaseUrl: string | undefined,
  confirmation: string | undefined,
  rebuild: (databaseUrl: string) => Promise<void> = rebuildDatabase
) {
  const target = parseStagingResetTarget(databaseUrl, confirmation)
  const targetIdentity = `${target.hostname}/${target.databaseName}`

  console.log(
    `Resetting staging database ${JSON.stringify(targetIdentity)} before migrating and seeding.`
  )

  await rebuild(target.databaseUrl)
}

export async function rebuildDatabase(databaseUrl: string) {
  const database = createDatabase(databaseUrl)

  try {
    await database.orm.execute(sql`drop schema if exists drizzle cascade`)
    await database.orm.execute(sql`drop schema if exists public cascade`)
    await database.orm.execute(sql`create schema public`)
    await migrate(database.orm, { migrationsFolder })
    await seedCoins(database, await readCoinSeed())
  } finally {
    await database.close()
  }
}
