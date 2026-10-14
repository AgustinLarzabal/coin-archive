import { fileURLToPath } from "node:url"

import { Pool } from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { rebuildDatabase } from "./index.js"

const RESET_DATABASE_NAME = "coin_archive_reset_test"
const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url))

function getIntegrationDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  expect(databaseUrl).toBeTruthy()
  return databaseUrl ?? ""
}

function getResetDatabaseUrl() {
  const databaseUrl = new URL(getIntegrationDatabaseUrl())
  databaseUrl.pathname = RESET_DATABASE_NAME
  return databaseUrl.toString()
}

async function recreateResetDatabase() {
  await withAdministrationDatabase(async (database) => {
    await database.query(
      `drop database if exists ${RESET_DATABASE_NAME} with (force)`
    )
    await database.query(`create database ${RESET_DATABASE_NAME}`)
  })
}

async function dropResetDatabase() {
  await withAdministrationDatabase(async (database) => {
    await database.query(
      `drop database if exists ${RESET_DATABASE_NAME} with (force)`
    )
  })
}

async function withAdministrationDatabase(
  operation: (database: Pool) => Promise<void>
) {
  const administrationPool = new Pool({
    connectionString: getIntegrationDatabaseUrl(),
  })

  try {
    await operation(administrationPool)
  } finally {
    await administrationPool.end()
  }
}

beforeAll(recreateResetDatabase)
afterAll(dropResetDatabase)

describe("database rebuild lifecycle", () => {
  it("removes prior state and restores the migrated seed state", async () => {
    const resetDatabaseUrl = getResetDatabaseUrl()
    const databaseBeforeReset = new Pool({ connectionString: resetDatabaseUrl })
    try {
      await databaseBeforeReset.query("create table reset_marker (id integer)")
      await databaseBeforeReset.query("create schema drizzle")
      await databaseBeforeReset.query(
        "create table drizzle.reset_marker (id integer)"
      )
    } finally {
      await databaseBeforeReset.end()
    }

    const initialWorkingDirectory = process.cwd()
    process.chdir(repositoryRoot)
    try {
      await rebuildDatabase(resetDatabaseUrl)
    } finally {
      process.chdir(initialWorkingDirectory)
    }

    const databaseAfterReset = new Pool({ connectionString: resetDatabaseUrl })
    try {
      const marker = await databaseAfterReset.query<{ name: string | null }>(
        "select to_regclass('public.reset_marker')::text as name"
      )
      expect(marker.rows).toEqual([{ name: null }])

      const migrationMarker = await databaseAfterReset.query<{
        name: string | null
      }>("select to_regclass('drizzle.reset_marker')::text as name")
      expect(migrationMarker.rows).toEqual([{ name: null }])

      const coins = await databaseAfterReset.query<{
        first_issue_year: number
        id: string
        last_issue_year: number
        title: string
      }>(
        "select id, title, first_issue_year, last_issue_year from coins order by id"
      )
      expect(coins.rows).toHaveLength(51)
      expect(
        coins.rows.map(({ first_issue_year, last_issue_year }) => ({
          first_issue_year,
          last_issue_year,
        }))
      ).toEqual([
        ...Array.from({ length: 6 }, () => ({
          first_issue_year: 2004,
          last_issue_year: 2004,
        })),
        ...Array.from({ length: 8 }, () => ({
          first_issue_year: 2005,
          last_issue_year: 2005,
        })),
        ...Array.from({ length: 7 }, () => ({
          first_issue_year: 2006,
          last_issue_year: 2006,
        })),
        ...Array.from({ length: 20 }, () => ({
          first_issue_year: 2007,
          last_issue_year: 2007,
        })),
        ...Array.from({ length: 10 }, () => ({
          first_issue_year: 2008,
          last_issue_year: 2008,
        })),
      ])
      expect(coins.rows[0]).toEqual({
        id: "00000000-0000-4000-8000-000000000001",
        title: "50th Anniversary of the World Food Programme",
        first_issue_year: 2004,
        last_issue_year: 2004,
      })
      expect(coins.rows.at(-1)).toEqual({
        id: "00000000-0000-4000-8000-000000000033",
        title: "Hamburg",
        first_issue_year: 2008,
        last_issue_year: 2008,
      })

      const issuers = await databaseAfterReset.query<{
        code: string
        coin_count: number
        name: string
      }>(`
        select issuers.name, issuers.code, count(coins.id)::integer as coin_count
        from issuers
        left join coins on coins.issuer_id = issuers.id
        group by issuers.id
      `)
      expect(issuers.rows).toEqual(
        expect.arrayContaining([
          { name: "Vatican City", code: "VA", coin_count: 5 },
          { name: "Italy", code: "IT", coin_count: 5 },
          { name: "San Marino", code: "SM", coin_count: 5 },
          { name: "Finland", code: "FI", coin_count: 6 },
          { name: "Luxembourg", code: "LU", coin_count: 6 },
          { name: "Greece", code: "GR", coin_count: 2 },
          { name: "Austria", code: "AT", coin_count: 2 },
          { name: "Belgium", code: "BE", coin_count: 4 },
          { name: "Germany", code: "DE", coin_count: 4 },
          { name: "Spain", code: "ES", coin_count: 2 },
          { name: "France", code: "FR", coin_count: 2 },
          { name: "Ireland", code: "IE", coin_count: 1 },
          { name: "Monaco", code: "MC", coin_count: 1 },
          { name: "Netherlands", code: "NL", coin_count: 1 },
          { name: "Portugal", code: "PT", coin_count: 3 },
          { name: "Slovenia", code: "SI", coin_count: 2 },
        ])
      )
      expect(issuers.rows).toHaveLength(16)

      const credits = await databaseAfterReset.query<{
        full_name: string
        kind: string
        position: number
      }>(`
        select engravers.full_name, coin_surfaces.kind,
          coin_surface_engravers.position
        from coin_surface_engravers
        join engravers on engravers.id = coin_surface_engravers.engraver_id
        join coin_surfaces on coin_surfaces.id = coin_surface_engravers.coin_surface_id
        order by coin_surfaces.kind, coin_surface_engravers.position
      `)
      expect(credits.rows).toEqual([])
    } finally {
      await databaseAfterReset.end()
    }
  })
})
