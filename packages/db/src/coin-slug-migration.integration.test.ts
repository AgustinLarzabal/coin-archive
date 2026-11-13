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

import { readCoinSeed } from "./seed.js"

it("backfills every existing Coin and Issuer Slug without changing identities or associations", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const oldMigrations = await mkdtemp(join(tmpdir(), "coin-slug-migrations-"))
  try {
    await pool.query(
      "drop schema if exists drizzle cascade; drop schema public cascade; create schema public"
    )
    await mkdir(join(oldMigrations, "meta"))
    const journal = JSON.parse(
      await readFile("drizzle/meta/_journal.json", "utf8")
    ) as { entries: Array<{ tag: string; idx: number }> }
    journal.entries = journal.entries.filter(({ idx }) => idx <= 32)
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

    const seed = await readCoinSeed()
    const issuerSeed = seed.issuers as Array<{ code: string; slug: string }>
    const coinSeed = seed.coins as Array<{
      id: string
      slug: string
      issuerCode: string
    }>
    await pool.query(
      `insert into issuers (name, code)
       select name, code from jsonb_to_recordset($1::jsonb) as records(name text, code text)`,
      [JSON.stringify(seed.issuers)]
    )
    await pool.query(
      `insert into coins (id, title, issuer_id, distribution_id, first_issue_year, last_issue_year)
       select records.id::uuid, records.title, issuers.id, distributions.id,
              records."firstIssueYear", records."lastIssueYear"
       from jsonb_to_recordset($1::jsonb) as records(
         id text, title text, "issuerCode" text, "firstIssueYear" integer, "lastIssueYear" integer
       )
       join issuers on issuers.code = records."issuerCode"
       cross join distributions
       where distributions.slug = 'circulating-commemorative'`,
      [JSON.stringify(seed.coins)]
    )
    const before = await pool.query<{ code: string; id: string }>(
      "select code, id from issuers"
    )
    await pool.query(
      "update issuers set name = 'Italian Republic' where code = 'IT'"
    )
    await pool.query(
      "update coins set title = 'World Food Programme corrected' where id = '00000000-0000-4000-8000-000000000001'"
    )

    await migrate(drizzle(pool), { migrationsFolder: "drizzle" })

    const issuerRows = await pool.query<{
      code: string
      id: string
      slug: string
    }>("select code, id, slug from issuers")
    expect(issuerRows.rows).toHaveLength(issuerSeed.length)
    expect(
      new Map(issuerRows.rows.map(({ code, slug }) => [code, slug]))
    ).toEqual(new Map(issuerSeed.map(({ code, slug }) => [code, slug])))
    expect(new Map(issuerRows.rows.map(({ code, id }) => [code, id]))).toEqual(
      new Map(before.rows.map(({ code, id }) => [code, id]))
    )
    expect(
      (await pool.query("select name from issuers where code = 'IT'")).rows
    ).toEqual([{ name: "Italian Republic" }])
    const coinRows = await pool.query<{
      id: string
      slug: string
      issuerCode: string
    }>(
      `select coins.id, coins.slug, issuers.code as "issuerCode"
       from coins join issuers on issuers.id = coins.issuer_id`
    )
    expect(coinRows.rows).toHaveLength(coinSeed.length)
    expect(
      new Map(
        coinRows.rows.map(({ id, slug, issuerCode }) => [
          id,
          { slug, issuerCode },
        ])
      )
    ).toEqual(
      new Map(
        coinSeed.map(({ id, slug, issuerCode }) => [id, { slug, issuerCode }])
      )
    )
    expect(
      (
        await pool.query(
          "select title from coins where id = '00000000-0000-4000-8000-000000000001'"
        )
      ).rows
    ).toEqual([{ title: "World Food Programme corrected" }])
  } finally {
    await pool.end()
    await rm(oldMigrations, { recursive: true, force: true })
  }
})
