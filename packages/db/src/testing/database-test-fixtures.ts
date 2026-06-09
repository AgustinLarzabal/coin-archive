import { eq } from "drizzle-orm"
import { coin } from "../schema/coin"
import { issuer } from "../schema/issuer"
import { getOrCreateDefaultComposition } from "./default-composition"
import { getOrCreateDefaultCurrency } from "./default-currency"
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
  comments?: string | null
  compositionId?: string
  currencyId?: string
  distributionId?: string
  faceValueNumericValue?: number
  faceValueText?: string
  issuerId: string
  maxYear?: number
  minYear?: number
  title: string
  createdAt: Date
}) {
  const distributionId =
    input.distributionId ?? (await insertDefaultDistribution()).id
  const compositionId =
    input.compositionId ?? (await insertDefaultComposition()).id
  const currencyId = input.currencyId ?? (await insertDefaultCurrency()).id

  const [insertedCoin] = await testDb
    .insert(coin)
    .values({
      comments: input.comments,
      compositionId,
      currencyId,
      distributionId,
      faceValueNumericValue: input.faceValueNumericValue ?? 1,
      faceValueText: input.faceValueText ?? "1 Test Unit",
      issuerId: input.issuerId,
      maxYear: input.maxYear,
      minYear: input.minYear,
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

async function insertDefaultComposition() {
  return getOrCreateDefaultComposition(testDb)
}

async function insertDefaultCurrency() {
  return getOrCreateDefaultCurrency(testDb)
}
