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

it("migrates existing Coin Distribution assignments to required catalogue references", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const oldMigrations = await mkdtemp(
    join(tmpdir(), "coin-distribution-migrations-")
  )
  try {
    await pool.query(
      "drop schema if exists drizzle cascade; drop schema public cascade; create schema public"
    )
    await mkdir(join(oldMigrations, "meta"))
    const journal = JSON.parse(
      await readFile("drizzle/meta/_journal.json", "utf8")
    ) as { entries: Array<{ tag: string; idx: number }> }
    journal.entries = journal.entries.filter(({ idx }) => idx <= 14)
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
      "insert into issuers (name, code) values ('Argentina', 'AR')"
    )
    await pool.query(`
      insert into coins (title, issuer_id, distribution, first_issue_year, last_issue_year)
      select seed.title, issuers.id, seed.distribution::coin_distribution, 2004, 2004
      from issuers
      cross join (values
        ('First', 'standard-circulation'),
        ('Second', 'circulating-commemorative'),
        ('Third', 'non-circulating')
      ) as seed(title, distribution)
    `)

    await migrate(drizzle(pool), { migrationsFolder: "drizzle" })

    const { rows } = await pool.query<{ title: string; distribution: string }>(
      "select coins.title, distributions.slug as distribution from coins join distributions on distributions.id = coins.distribution_id order by coins.title"
    )
    expect(rows).toEqual([
      { title: "First", distribution: "standard-circulation" },
      { title: "Second", distribution: "circulating-commemorative" },
      { title: "Third", distribution: "non-circulating" },
    ])
    const enumType = await pool.query(
      "select 1 from pg_type where typname = 'coin_distribution'"
    )
    expect(enumType.rowCount).toBe(0)
    await expect(
      pool.query("delete from distributions where slug = 'non-circulating'")
    ).rejects.toThrow()
  } finally {
    await pool.end()
    await rm(oldMigrations, { recursive: true, force: true })
  }
})
