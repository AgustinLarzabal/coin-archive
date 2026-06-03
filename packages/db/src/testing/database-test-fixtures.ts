import { eq } from "drizzle-orm"
import { coin } from "../schema/coin"
import { issuer } from "../schema/issuer"
import { createTestDatabase } from "./database-test-client"

const { client, db: testDb } = createTestDatabase()

export { testDb }
export function closeTestDatabase() {
  return client.end()
}

export async function insertIssuer(input: {
  code: string
  name: string
  parentIssuerCode?: string
}) {
  let parentIssuerId: string | undefined

  if (input.parentIssuerCode) {
    const [parentIssuer] = await testDb
      .select({ id: issuer.id })
      .from(issuer)
      .where(eq(issuer.code, input.parentIssuerCode))
      .limit(1)

    parentIssuerId = parentIssuer?.id
  }

  const [insertedIssuer] = await testDb
    .insert(issuer)
    .values({
      code: input.code,
      name: input.name,
      parentIssuerId,
    })
    .returning()

  return insertedIssuer
}

export async function insertCoin(input: {
  issuerId: string
  title: string
  createdAt: Date
}) {
  const [insertedCoin] = await testDb
    .insert(coin)
    .values({
      issuerId: input.issuerId,
      title: input.title,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    })
    .returning()

  return insertedCoin
}
