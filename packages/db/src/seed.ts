import { readFile } from "node:fs/promises"

import { z } from "zod"

import {
  coins,
  coinSeedRecordSchema,
  coinSurfaceEngravers,
  coinSurfaces,
  engravers,
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

const coinSurfaceSeedShape = {
  description: z
    .string()
    .min(1)
    .max(10_000)
    .refine((description) => description === description.trim(), {
      message: "Coin Surface description must be trimmed",
    })
    .optional(),
  imageKey: imageKeySchema.optional(),
}

const hasCatalogueData = (surface: {
  description?: string
  imageKey?: string
}) => surface.description !== undefined || surface.imageKey !== undefined

const coinSurfaceSeedRecordSchema = z
  .strictObject(coinSurfaceSeedShape)
  .refine(hasCatalogueData, {
    message: "Coin Surface must contain catalogue data",
  })

const coinSurfaceWithEngraversSeedRecordSchema = z
  .strictObject({
    ...coinSurfaceSeedShape,
    engraverIds: z.array(z.uuid()).optional(),
  })
  .refine(hasCatalogueData, {
    message: "Coin Surface must contain catalogue data",
  })

const coinSeedWithSurfacesSchema = coinSeedRecordSchema.extend({
  obverse: coinSurfaceWithEngraversSeedRecordSchema.optional(),
  reverse: coinSurfaceWithEngraversSeedRecordSchema.optional(),
  edge: coinSurfaceSeedRecordSchema.optional(),
})

const seedDocumentSchema = z
  .object({
    issuers: z.array(issuerSeedRecordSchema),
    engravers: z.array(
      z.strictObject({
        id: z.uuid(),
        fullName: z
          .string()
          .min(1)
          .max(200)
          .refine((fullName) => fullName === fullName.trim(), {
            message: "Engraver full name must be trimmed",
          }),
      })
    ),
    coins: z.array(coinSeedWithSurfacesSchema),
  })
  .strict()
  .superRefine((document, context) => {
    const issuerCodes = new Set<string>()
    const engraverIds = new Set<string>()

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

    document.engravers.forEach((engraver, index) => {
      if (engraverIds.has(engraver.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate Engraver ID: ${engraver.id}`,
          path: ["engravers", index, "id"],
        })
      }
      engraverIds.add(engraver.id)
    })

    document.coins.forEach((coin, index) => {
      if (!issuerCodes.has(coin.issuerCode)) {
        context.addIssue({
          code: "custom",
          message: `Coin references unknown Issuer Code: ${coin.issuerCode}`,
          path: ["coins", index, "issuerCode"],
        })
      }
      for (const kind of ["obverse", "reverse"] as const) {
        coin[kind]?.engraverIds?.forEach((engraverId, creditIndex) => {
          if (!engraverIds.has(engraverId)) {
            context.addIssue({
              code: "custom",
              message: `Coin Surface references unknown Engraver ID: ${engraverId}`,
              path: ["coins", index, kind, "engraverIds", creditIndex],
            })
          }
        })
      }
    })
  })

export type CoinSeedDocument = z.infer<typeof seedDocumentSchema>

export async function seedCoins(database: Database, input: unknown) {
  const document = seedDocumentSchema.parse(input)

  await database.orm.transaction(async (transaction) => {
    if (document.engravers.length > 0) {
      await transaction.insert(engravers).values(document.engravers)
    }
    const insertedIssuers = await transaction
      .insert(issuers)
      .values(document.issuers)
      .returning({ id: issuers.id, code: issuers.code })
    const issuerIdsByCode = new Map(
      insertedIssuers.map((issuer) => [issuer.code, issuer.id])
    )

    await transaction.insert(coins).values(
      document.coins.map(
        ({
          issuerCode,
          obverse: _obverse,
          reverse: _reverse,
          edge: _edge,
          ...coin
        }) => {
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
      ({ id: coinId, obverse, reverse, edge }) => [
        ...(obverse
          ? [
              {
                description: obverse.description,
                imageKey: obverse.imageKey,
                coinId,
                kind: "obverse" as const,
              },
            ]
          : []),
        ...(reverse
          ? [
              {
                description: reverse.description,
                imageKey: reverse.imageKey,
                coinId,
                kind: "reverse" as const,
              },
            ]
          : []),
        ...(edge ? [{ ...edge, coinId, kind: "edge" as const }] : []),
      ]
    )
    if (surfaces.length > 0) {
      const insertedSurfaces = await transaction
        .insert(coinSurfaces)
        .values(surfaces)
        .returning({
          id: coinSurfaces.id,
          coinId: coinSurfaces.coinId,
          kind: coinSurfaces.kind,
        })
      const surfaceIds = new Map(
        insertedSurfaces.map((surface) => [
          `${surface.coinId}:${surface.kind}`,
          surface.id,
        ])
      )
      const credits = document.coins.flatMap((coin) =>
        (["obverse", "reverse"] as const).flatMap((kind) => {
          const surface = coin[kind]
          if (!surface?.engraverIds) return []
          const coinSurfaceId = surfaceIds.get(`${coin.id}:${kind}`)
          if (!coinSurfaceId) throw new Error(`Missing seeded ${kind}`)
          return surface.engraverIds.map((engraverId, index) => ({
            coinSurfaceId,
            engraverId,
            position: index + 1,
          }))
        })
      )
      if (credits.length > 0) {
        await transaction.insert(coinSurfaceEngravers).values(credits)
      }
    }
  })
}

export async function readCoinSeed(
  path = new URL("../seed/coins.json", import.meta.url)
) {
  return JSON.parse(await readFile(path, "utf8")) as unknown
}
