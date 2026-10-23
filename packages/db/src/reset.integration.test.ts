import { fileURLToPath } from "node:url"

import { Pool } from "pg"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { readCoinSeed, rebuildDatabase } from "./index.js"

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

beforeEach(recreateResetDatabase)
afterAll(dropResetDatabase)

describe("database rebuild lifecycle", () => {
  it.each([
    {
      name: "a malformed seed document",
      input: () => ({}),
      error: /issuers/,
    },
    {
      name: "an unknown Denomination reference",
      input: async () => {
        const seed = await readCoinSeed()
        const coins = seed.coins as Array<{
          denomination?: { currencySlug: string; label: string }
        }>
        coins[0].denomination = {
          currencySlug: "euro",
          label: "missing denomination",
        }
        return seed
      },
      error: /Coin references unknown Denomination/,
    },
  ])("preserves prior state for $name", async ({ input, error }) => {
    const resetDatabaseUrl = getResetDatabaseUrl()
    const database = new Pool({ connectionString: resetDatabaseUrl })
    try {
      await database.query("create table reset_marker (id integer)")
      await database.query("insert into reset_marker (id) values (42)")

      await expect(
        rebuildDatabase(resetDatabaseUrl, await input())
      ).rejects.toThrow(error)

      const marker = await database.query<{ id: number }>(
        "select id from reset_marker"
      )
      expect(marker.rows).toEqual([{ id: 42 }])
    } finally {
      await database.end()
    }
  })

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
      expect(coins.rows).toHaveLength(587)
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
        ...Array.from({ length: 25 }, () => ({
          first_issue_year: 2009,
          last_issue_year: 2009,
        })),
        ...Array.from({ length: 12 }, () => ({
          first_issue_year: 2010,
          last_issue_year: 2010,
        })),
        ...Array.from({ length: 16 }, () => ({
          first_issue_year: 2011,
          last_issue_year: 2011,
        })),
        ...Array.from({ length: 30 }, () => ({
          first_issue_year: 2012,
          last_issue_year: 2012,
        })),
        ...Array.from({ length: 23 }, () => ({
          first_issue_year: 2013,
          last_issue_year: 2013,
        })),
        ...Array.from({ length: 27 }, () => ({
          first_issue_year: 2014,
          last_issue_year: 2014,
        })),
        ...Array.from({ length: 47 }, () => ({
          first_issue_year: 2015,
          last_issue_year: 2015,
        })),
        ...Array.from({ length: 32 }, () => ({
          first_issue_year: 2016,
          last_issue_year: 2016,
        })),
        ...Array.from({ length: 32 }, () => ({
          first_issue_year: 2017,
          last_issue_year: 2017,
        })),
        ...Array.from({ length: 36 }, () => ({
          first_issue_year: 2018,
          last_issue_year: 2018,
        })),
        ...Array.from({ length: 32 }, () => ({
          first_issue_year: 2019,
          last_issue_year: 2019,
        })),
        ...Array.from({ length: 35 }, () => ({
          first_issue_year: 2020,
          last_issue_year: 2020,
        })),
        ...Array.from({ length: 33 }, () => ({
          first_issue_year: 2021,
          last_issue_year: 2021,
        })),
        ...Array.from({ length: 49 }, () => ({
          first_issue_year: 2022,
          last_issue_year: 2022,
        })),
        ...Array.from({ length: 36 }, () => ({
          first_issue_year: 2023,
          last_issue_year: 2023,
        })),
        ...Array.from({ length: 35 }, () => ({
          first_issue_year: 2024,
          last_issue_year: 2024,
        })),
        ...Array.from({ length: 36 }, () => ({
          first_issue_year: 2025,
          last_issue_year: 2025,
        })),
      ])
      expect(coins.rows[0]).toEqual({
        id: "00000000-0000-4000-8000-000000000001",
        title: "50th Anniversary of the World Food Programme",
        first_issue_year: 2004,
        last_issue_year: 2004,
      })
      expect(coins.rows.at(-1)).toEqual({
        id: "00000000-0000-4000-8000-00000000024b",
        title: "Sēlija",
        first_issue_year: 2025,
        last_issue_year: 2025,
      })

      const faceValues = await databaseAfterReset.query<{
        amount: string
        currency_name: string
        currency_slug: string
        denomination_label: string
        coin_id: string
        period_label: string
      }>(`
        select coins.id as coin_id,
          denominations.label as denomination_label,
          denominations.amount,
          currencies.slug as currency_slug,
          currencies.name as currency_name,
          currencies.period_label
        from coins
        join denominations on denominations.id = coins.denomination_id
        join currencies on currencies.id = denominations.currency_id
        order by coins.id
      `)
      expect(faceValues.rows).toEqual([
        {
          coin_id: "00000000-0000-4000-8000-000000000001",
          denomination_label: "2 euro",
          amount: "2",
          currency_slug: "euro",
          currency_name: "Euro",
          period_label: "1999–present",
        },
        ...[
          "00000000-0000-4000-8000-00000000000c",
          "00000000-0000-4000-8000-00000000004b",
          "00000000-0000-4000-8000-000000000084",
          "00000000-0000-4000-8000-00000000009e",
          "00000000-0000-4000-8000-00000000013e",
        ].map((coinId) => ({
          coin_id: coinId,
          denomination_label: "2 euro",
          amount: "2",
          currency_slug: "euro",
          currency_name: "Euro",
          period_label: "1999–present",
        })),
      ])

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
          { name: "Vatican City", code: "VA", coin_count: 34 },
          { name: "Italy", code: "IT", coin_count: 38 },
          { name: "San Marino", code: "SM", coin_count: 34 },
          { name: "Finland", code: "FI", coin_count: 39 },
          { name: "Luxembourg", code: "LU", coin_count: 42 },
          { name: "Greece", code: "GR", coin_count: 31 },
          { name: "Austria", code: "AT", coin_count: 8 },
          { name: "Belgium", code: "BE", coin_count: 35 },
          { name: "Germany", code: "DE", coin_count: 33 },
          { name: "Spain", code: "ES", coin_count: 27 },
          { name: "France", code: "FR", coin_count: 35 },
          { name: "Ireland", code: "IE", coin_count: 8 },
          { name: "Monaco", code: "MC", coin_count: 16 },
          { name: "Netherlands", code: "NL", coin_count: 9 },
          { name: "Portugal", code: "PT", coin_count: 35 },
          { name: "Slovenia", code: "SI", coin_count: 21 },
          { name: "Cyprus", code: "CY", coin_count: 8 },
          { name: "Estonia", code: "EE", coin_count: 18 },
          { name: "Latvia", code: "LV", coin_count: 18 },
          { name: "Lithuania", code: "LT", coin_count: 19 },
          { name: "Andorra", code: "AD", coin_count: 23 },
          { name: "Malta", code: "MT", coin_count: 31 },
          { name: "Slovakia", code: "SK", coin_count: 20 },
          { name: "Croatia", code: "HR", coin_count: 5 },
        ])
      )
      expect(issuers.rows).toHaveLength(24)

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
      expect(credits.rows).toEqual(
        expect.arrayContaining([
          { full_name: "George Stamatopoulos", kind: "obverse", position: 1 },
          { full_name: "Helmut Andexlinger", kind: "obverse", position: 1 },
        ])
      )
      expect(credits.rows).toHaveLength(2)

      const attributions = await databaseAfterReset.query<{
        coin_id: string
        name: string
        position: number
        role: string
        slug: string
        tenure: string | null
      }>(`
        select coin_ruling_authorities.coin_id, ruling_authorities.slug,
          ruling_authorities.name, coin_ruling_authorities.role,
          coin_ruling_authorities.tenure, coin_ruling_authorities.position
        from coin_ruling_authorities
        join ruling_authorities
          on ruling_authorities.id = coin_ruling_authorities.ruling_authority_id
        order by coin_ruling_authorities.coin_id,
          coin_ruling_authorities.position
      `)
      expect(attributions.rows).toEqual(
        expect.arrayContaining([
          {
            coin_id: "00000000-0000-4000-8000-000000000001",
            slug: "italian-republic",
            name: "Italian Republic",
            role: "Period",
            tenure: "1946–present",
            position: 1,
          },
          {
            coin_id: "00000000-0000-4000-8000-000000000002",
            slug: "john-paul-ii",
            name: "John Paul II (Ioannes Paulus II)",
            role: "Pope",
            tenure: "1978–2005",
            position: 1,
          },
          {
            coin_id: "00000000-0000-4000-8000-000000000003",
            slug: "republic-of-san-marino",
            name: "Republic of San Marino",
            role: "Period",
            tenure: "301–present",
            position: 1,
          },
          {
            coin_id: "00000000-0000-4000-8000-000000000004",
            slug: "henri-of-luxembourg",
            name: "Henri",
            role: "Grand Duke",
            tenure: "2000–2025",
            position: 1,
          },
          {
            coin_id: "00000000-0000-4000-8000-000000000005",
            slug: "republic-of-finland",
            name: "Republic of Finland",
            role: "Period",
            tenure: "1919–present",
            position: 1,
          },
          {
            coin_id: "00000000-0000-4000-8000-000000000006",
            slug: "third-hellenic-republic",
            name: "Third Hellenic Republic",
            role: "Period",
            tenure: "1974–present",
            position: 1,
          },
        ])
      )
    } finally {
      await databaseAfterReset.end()
    }
  })
})
