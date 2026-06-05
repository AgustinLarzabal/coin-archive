import { eq } from "drizzle-orm"
import { coin } from "../schema/coin"
import { issuer } from "../schema/issuer"
import { createTestDatabase } from "./database-test-client"
import { getOrCreateDefaultDistribution } from "./default-distribution"

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
  distributionId?: string
  issuerId: string
  title: string
  createdAt: Date
}) {
  const distributionId =
    input.distributionId ?? (await insertDefaultDistribution()).id

  const [insertedCoin] = await testDb
    .insert(coin)
    .values({
      distributionId,
      issuerId: input.issuerId,
      title: input.title,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    })
    .returning()

  return insertedCoin
}

async function insertDefaultDistribution() {
  return getOrCreateDefaultDistribution(testDb)
}
