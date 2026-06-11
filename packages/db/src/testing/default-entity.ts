import type * as ClientModule from "../client"
import { eq } from "drizzle-orm"
import type { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core"

type Database = typeof ClientModule.db

type DefaultEntityValues = {
  code: string
}

export async function getOrCreateDefaultEntity<
  TTable extends AnyPgTable,
  TValues extends TTable["$inferInsert"] & DefaultEntityValues,
>(
  database: Database,
  table: TTable,
  codeColumn: AnyPgColumn,
  values: TValues
): Promise<TTable["$inferSelect"]> {
  const typedTable = table as AnyPgTable

  const existing = (
    await database.select().from(typedTable).where(eq(codeColumn, values.code)).limit(1)
  ).at(0)

  if (existing) {
    return existing
  }

  const created = (await database.insert(typedTable).values(values).returning()).at(0)

  if (!created) {
    throw new Error(`Failed to insert default entity for code "${values.code}"`)
  }

  return created
}
