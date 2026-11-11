import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"
import { expect, it } from "vitest"

it("moves existing role and tenure to their Ruling Authority", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const oldMigrations = await mkdtemp(
    join(tmpdir(), "ruling-authority-migrations-")
  )
  try {
    await pool.query(
      "drop schema if exists drizzle cascade; drop schema public cascade; create schema public"
    )
    await mkdir(join(oldMigrations, "meta"))
    const journal = JSON.parse(
      await readFile("drizzle/meta/_journal.json", "utf8")
    ) as { entries: Array<{ tag: string; idx: number }> }
    journal.entries = journal.entries.filter(({ idx }) => idx <= 30)
    await writeFile(
      join(oldMigrations, "meta", "_journal.json"),
      JSON.stringify(journal)
    )
    for (const { tag } of journal.entries) {
      await copyFile(
        join("drizzle", `${tag}.sql`),
        join(oldMigrations, `${tag}.sql`)
      )
    }
    await migrate(drizzle(pool), { migrationsFolder: oldMigrations })
    await pool.query(
      "insert into issuers (name, code) values ('Test Issuer', 'TI')"
    )
    await pool.query(`
      insert into coins (title, issuer_id, distribution_id, first_issue_year, last_issue_year)
      select 'Test Coin', issuers.id, distributions.id, 2004, 2004
      from issuers cross join distributions
      where distributions.slug = 'standard-circulation'
    `)
    await pool.query(
      "insert into ruling_authorities (slug, name) values ('test-authority', 'Test Authority')"
    )
    await pool.query(`
      insert into coin_ruling_authorities (coin_id, ruling_authority_id, role, tenure, position)
      select coins.id, ruling_authorities.id, 'President', '2000–2004', 1
      from coins cross join ruling_authorities
    `)

    await migrate(drizzle(pool), { migrationsFolder: "drizzle" })

    const { rows } = await pool.query<{
      slug: string
      role: string
      tenure: string
    }>("select slug, role, tenure from ruling_authorities")
    expect(rows).toEqual([
      { slug: "test-authority", role: "President", tenure: "2000–2004" },
    ])
    const columns = await pool.query<{ column_name: string }>(`
      select column_name from information_schema.columns
      where table_name = 'coin_ruling_authorities'
        and column_name in ('role', 'tenure')
    `)
    expect(columns.rows).toEqual([])
  } finally {
    await pool.end()
    await rm(oldMigrations, { recursive: true, force: true })
  }
})
