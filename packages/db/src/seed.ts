import { readFile } from "node:fs/promises"

import { z } from "zod"

import {
  coins,
  coinSeedRecordSchema,
  coinSurfaces,
  issuers,
  issuerSeedRecordSchema,
} from "./schema/index.js"
import type { Database } from "./connection.js"

const imageKeySchema = z
  .string()
  .min(1)
  .max(1_024)
  .refine((imageKey) => imageKey === imageKey.trim(), {
    message: "Coin Surface image key must be trimmed",
  })
  .refine(
    (imageKey) =>
      !imageKey.startsWith("/") &&
      !/^[a-z][a-z0-9+.-]*:/i.test(imageKey) &&
      !imageKey
        .split("/")
        .some((segment) => segment === "." || segment === ".."),
    { message: "Coin Surface image location must be an R2 object key" }
  )

const coinSurfaceSeedRecordSchema = z
  .strictObject({
    description: z
      .string()
      .min(1)
      .max(10_000)
      .refine((description) => description === description.trim(), {
        message: "Coin Surface description must be trimmed",
      })
      .optional(),
    imageKey: imageKeySchema.optional(),
  })
  .refine(
    (surface) =>
      surface.description !== undefined || surface.imageKey !== undefined,
    { message: "Coin Surface must contain catalogue data" }
  )

const coinSeedWithSurfacesSchema = coinSeedRecordSchema.extend({
  obverse: coinSurfaceSeedRecordSchema.optional(),
  reverse: coinSurfaceSeedRecordSchema.optional(),
})

const seedDocumentSchema = z
  .object({
    issuers: z.array(issuerSeedRecordSchema),
    coins: z.array(coinSeedWithSurfacesSchema),
  })
  .strict()
  .superRefine((document, context) => {
    const issuerCodes = new Set<string>()

    document.issuers.forEach((issuer, index) => {
      if (issuerCodes.has(issuer.code)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate Issuer Code: ${issuer.code}`,
          path: ["issuers", index, "code"],
        })
      }
      issuerCodes.add(issuer.code)
    })

    document.coins.forEach((coin, index) => {
      if (!issuerCodes.has(coin.issuerCode)) {
        context.addIssue({
          code: "custom",
          message: `Coin references unknown Issuer Code: ${coin.issuerCode}`,
          path: ["coins", index, "issuerCode"],
        })
      }
    })
  })

export type CoinSeedDocument = z.infer<typeof seedDocumentSchema>

export async function seedCoins(database: Database, input: unknown) {
  const document = seedDocumentSchema.parse(input)

  await database.orm.transaction(async (transaction) => {
    const insertedIssuers = await transaction
      .insert(issuers)
      .values(document.issuers)
      .returning({ id: issuers.id, code: issuers.code })
    const issuerIdsByCode = new Map(
      insertedIssuers.map((issuer) => [issuer.code, issuer.id])
    )

    await transaction.insert(coins).values(
      document.coins.map(
        ({ issuerCode, obverse: _obverse, reverse: _reverse, ...coin }) => {
          const issuerId = issuerIdsByCode.get(issuerCode)
          if (!issuerId) {
            throw new Error(
              `Coin references unknown Issuer Code: ${issuerCode}`
            )
          }
          return { ...coin, issuerId }
        }
      )
    )

    const surfaces = document.coins.flatMap(
      ({ id: coinId, obverse, reverse }) => [
        ...(obverse ? [{ ...obverse, coinId, kind: "obverse" as const }] : []),
        ...(reverse ? [{ ...reverse, coinId, kind: "reverse" as const }] : []),
      ]
    )
    if (surfaces.length > 0) {
      await transaction.insert(coinSurfaces).values(surfaces)
    }
  })
}

export async function readCoinSeed(
  path = new URL("../seed/coins.json", import.meta.url)
) {
  return JSON.parse(await readFile(path, "utf8")) as unknown
}
