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

it("migrates existing Coins with unknown Composition and Detail", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const oldMigrations = await mkdtemp(
    join(tmpdir(), "coin-composition-migrations-")
  )
  try {
    await pool.query(
      "drop schema if exists drizzle cascade; drop schema public cascade; create schema public"
    )
    await mkdir(join(oldMigrations, "meta"))
    const journal = JSON.parse(
      await readFile("drizzle/meta/_journal.json", "utf8")
    ) as { entries: Array<{ tag: string; idx: number }> }
    journal.entries = journal.entries.filter(({ idx }) => idx <= 19)
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
      "insert into issuers (name, code) values ('Finland', 'FI')"
    )
    await pool.query(`
      insert into coins (id, title, issuer_id, distribution_id, first_issue_year, last_issue_year)
      select '00000000-0000-4000-8000-000000000005', 'Existing Coin', issuers.id, distributions.id, 2004, 2004
      from issuers cross join distributions
      where issuers.code = 'FI' and distributions.slug = 'circulating-commemorative'
    `)

    await migrate(drizzle(pool), { migrationsFolder: "drizzle" })

    const { rows } = await pool.query(
      "select composition_id, composition_detail from coins where title = 'Existing Coin'"
    )
    expect(rows).toEqual([{ composition_id: null, composition_detail: null }])
    const catalogue = await pool.query(
      "select slug, name from compositions where slug = 'bimetallic'"
    )
    expect(catalogue.rows).toEqual([{ slug: "bimetallic", name: "Bimetallic" }])
  } finally {
    await pool.end()
    await rm(oldMigrations, { recursive: true, force: true })
  }
})
