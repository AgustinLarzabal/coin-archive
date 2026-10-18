import { readFile } from "node:fs/promises"

import { sql } from "drizzle-orm"
import { z } from "zod"

import {
  coinRulingAuthorityAttributions,
  coins,
  coinSeedRecordSchema,
  coinSurfaceEngravers,
  coinSurfaces,
  currencies,
  currencySeedRecordSchema,
  denominations,
  engravers,
  issuers,
  issuerSeedRecordSchema,
  rulingAuthorities,
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

const engraverSlugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const rulingAuthoritySlugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const currencySlugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const trimmedDisplayText = (maximumLength: number, label: string) =>
  z
    .string()
    .min(1)
    .max(maximumLength)
    .refine((value) => value === value.trim(), {
      message: `${label} must be trimmed`,
    })

const authoritySeedRecordSchema = z.strictObject({
  slug: rulingAuthoritySlugSchema,
  name: trimmedDisplayText(200, "Ruling Authority name"),
})

const coinRulingAuthoritySeedRecordSchema = z.strictObject({
  slug: rulingAuthoritySlugSchema,
  role: trimmedDisplayText(100, "Ruling Authority Role"),
  tenure: trimmedDisplayText(200, "Ruling Authority Tenure Label").optional(),
  position: z.int().positive(),
})

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

const hasDescriptionOrImage = (surface: {
  description?: string
  imageKey?: string
}) => surface.description !== undefined || surface.imageKey !== undefined

const coinSurfaceSeedRecordSchema = z
  .strictObject(coinSurfaceSeedShape)
  .refine(hasDescriptionOrImage, {
    message: "Coin Surface must contain catalogue data",
  })

const coinSurfaceWithEngraversSeedRecordSchema = z
  .strictObject({
    ...coinSurfaceSeedShape,
    engraverSlugs: z.array(engraverSlugSchema).optional(),
  })
  .refine(
    (surface) =>
      hasDescriptionOrImage(surface) ||
      (surface.engraverSlugs?.length ?? 0) > 0,
    {
      message: "Coin Surface must contain catalogue data",
    }
  )

const coinSeedWithSurfacesSchema = coinSeedRecordSchema.extend({
  denomination: z
    .strictObject({
      currencySlug: currencySlugSchema,
      label: trimmedDisplayText(200, "Denomination label"),
    })
    .optional(),
  obverse: coinSurfaceWithEngraversSeedRecordSchema.optional(),
  reverse: coinSurfaceWithEngraversSeedRecordSchema.optional(),
  edge: coinSurfaceSeedRecordSchema.optional(),
  rulingAuthorityAttributions: z
    .array(coinRulingAuthoritySeedRecordSchema)
    .default([]),
})

const denominationAmountSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,17})(?:\.\d{1,12})?$/)
  .refine((amount) => !/^0(?:\.0+)?$/.test(amount), {
    message: "Denomination amount must be positive",
  })

const denominationSeedRecordSchema = z.strictObject({
  currencySlug: currencySlugSchema,
  label: trimmedDisplayText(200, "Denomination label"),
  amount: denominationAmountSchema,
})

function denominationKey(currencyIdentity: string, normalizedLabel: string) {
  return JSON.stringify([currencyIdentity, normalizedLabel])
}

const seedDocumentSchema = z
  .object({
    issuers: z.array(issuerSeedRecordSchema),
    currencies: z.array(currencySeedRecordSchema).default([]),
    denominations: z.array(denominationSeedRecordSchema).default([]),
    authorities: z.array(authoritySeedRecordSchema).default([]),
    engravers: z.array(
      z.strictObject({
        slug: engraverSlugSchema,
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
    const currencySlugs = new Set<string>()
    const engraverSlugs = new Set<string>()
    const authoritySlugs = new Set<string>()

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

    document.currencies.forEach((currency, index) => {
      if (currencySlugs.has(currency.slug)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate Currency Slug: ${currency.slug}`,
          path: ["currencies", index, "slug"],
        })
      }
      currencySlugs.add(currency.slug)
    })

    document.denominations.forEach((denomination, index) => {
      if (!currencySlugs.has(denomination.currencySlug)) {
        context.addIssue({
          code: "custom",
          message: `Denomination references unknown Currency Slug: ${denomination.currencySlug}`,
          path: ["denominations", index, "currencySlug"],
        })
      }
    })

    document.engravers.forEach((engraver, index) => {
      if (engraverSlugs.has(engraver.slug)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate Engraver Slug: ${engraver.slug}`,
          path: ["engravers", index, "slug"],
        })
      }
      engraverSlugs.add(engraver.slug)
    })

    document.authorities.forEach((authority, index) => {
      if (authoritySlugs.has(authority.slug)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate Ruling Authority Slug: ${authority.slug}`,
          path: ["authorities", index, "slug"],
        })
      }
      authoritySlugs.add(authority.slug)
    })

    document.coins.forEach((coin, index) => {
      if (!issuerCodes.has(coin.issuerCode)) {
        context.addIssue({
          code: "custom",
          message: `Coin references unknown Issuer Code: ${coin.issuerCode}`,
          path: ["coins", index, "issuerCode"],
        })
      }
      const attributionPositions = new Set<number>()
      const contextualAttributions = new Set<string>()
      coin.rulingAuthorityAttributions.forEach(
        (attribution, attributionIndex) => {
          if (!authoritySlugs.has(attribution.slug)) {
            context.addIssue({
              code: "custom",
              message: `Coin references unknown Ruling Authority Slug: ${attribution.slug}`,
              path: [
                "coins",
                index,
                "rulingAuthorityAttributions",
                attributionIndex,
                "slug",
              ],
            })
          }
          if (attributionPositions.has(attribution.position)) {
            context.addIssue({
              code: "custom",
              message: `Duplicate Ruling Authority position: ${attribution.position}`,
              path: [
                "coins",
                index,
                "rulingAuthorityAttributions",
                attributionIndex,
                "position",
              ],
            })
          }
          attributionPositions.add(attribution.position)
          const contextualAttribution = JSON.stringify([
            attribution.slug,
            attribution.role,
            attribution.tenure ?? null,
          ])
          if (contextualAttributions.has(contextualAttribution)) {
            context.addIssue({
              code: "custom",
              message: `Duplicate Ruling Authority attribution: ${attribution.slug} / ${attribution.role} / ${attribution.tenure ?? "no tenure"}`,
              path: [
                "coins",
                index,
                "rulingAuthorityAttributions",
                attributionIndex,
              ],
            })
          }
          contextualAttributions.add(contextualAttribution)
        }
      )
      for (const kind of ["obverse", "reverse"] as const) {
        const surfaceEngraverSlugs = new Set<string>()
        coin[kind]?.engraverSlugs?.forEach((engraverSlug, creditIndex) => {
          if (!engraverSlugs.has(engraverSlug)) {
            context.addIssue({
              code: "custom",
              message: `Coin Surface references unknown Engraver Slug: ${engraverSlug}`,
              path: ["coins", index, kind, "engraverSlugs", creditIndex],
            })
          }
          if (surfaceEngraverSlugs.has(engraverSlug)) {
            context.addIssue({
              code: "custom",
              message: `Duplicate Engraver reference: ${engraverSlug}`,
              path: ["coins", index, kind, "engraverSlugs", creditIndex],
            })
          }
          surfaceEngraverSlugs.add(engraverSlug)
        })
      }
    })
  })

export type CoinSeedDocument = z.infer<typeof seedDocumentSchema>

function parseCoinSeedDocument(input: unknown): CoinSeedDocument {
  return seedDocumentSchema.parse(input)
}

async function normalizeDenominationLabels(
  database: Database,
  document: CoinSeedDocument
) {
  const labels = new Set([
    ...document.denominations.map(({ label }) => label),
    ...document.coins.flatMap(({ denomination }) =>
      denomination ? [denomination.label] : []
    ),
  ])
  const normalizedLabels = await Promise.all(
    [...labels].map(async (label) => {
      const result = await database.orm.execute<{ normalizedLabel: string }>(
        sql`select lower(${label}) as "normalizedLabel"`
      )
      const normalizedLabel = result.rows.at(0)?.normalizedLabel
      if (normalizedLabel === undefined) {
        throw new Error(`Failed to normalize Denomination label: ${label}`)
      }
      return [label, normalizedLabel] as const
    })
  )
  return new Map(normalizedLabels)
}

function validateDenominationReferences(
  document: CoinSeedDocument,
  normalizedLabels: ReadonlyMap<string, string>
) {
  const denominationKeys = new Set<string>()
  for (const denomination of document.denominations) {
    const normalizedLabel = normalizedLabels.get(denomination.label)
    if (normalizedLabel === undefined) {
      throw new Error(
        `Failed to normalize Denomination label: ${denomination.label}`
      )
    }
    const key = denominationKey(denomination.currencySlug, normalizedLabel)
    if (denominationKeys.has(key)) {
      throw new Error(
        `Duplicate Denomination label for Currency: ${denomination.currencySlug} / ${denomination.label}`
      )
    }
    denominationKeys.add(key)
  }
  for (const coin of document.coins) {
    if (!coin.denomination) continue
    const normalizedLabel = normalizedLabels.get(coin.denomination.label)
    if (
      normalizedLabel === undefined ||
      !denominationKeys.has(
        denominationKey(coin.denomination.currencySlug, normalizedLabel)
      )
    ) {
      throw new Error(
        `Coin references unknown Denomination: ${coin.denomination.currencySlug} / ${coin.denomination.label}`
      )
    }
  }
}

export async function seedCoins(database: Database, input: unknown) {
  const document = parseCoinSeedDocument(input)
  const normalizedDenominationLabels = await normalizeDenominationLabels(
    database,
    document
  )
  validateDenominationReferences(document, normalizedDenominationLabels)

  await database.orm.transaction(async (transaction) => {
    const insertedCurrencies =
      document.currencies.length === 0
        ? []
        : await transaction
            .insert(currencies)
            .values(document.currencies)
            .returning({ id: currencies.id, slug: currencies.slug })
    const currencyIdsBySlug = new Map(
      insertedCurrencies.map((currency) => [currency.slug, currency.id])
    )
    const insertedDenominations =
      document.denominations.length === 0
        ? []
        : await transaction
            .insert(denominations)
            .values(
              document.denominations.map(({ currencySlug, label, amount }) => {
                const currencyId = currencyIdsBySlug.get(currencySlug)
                if (!currencyId) {
                  throw new Error(
                    `Denomination references unknown Currency Slug: ${currencySlug}`
                  )
                }
                return { currencyId, label, amount }
              })
            )
            .returning({
              id: denominations.id,
              currencyId: denominations.currencyId,
              label: denominations.label,
            })
    const denominationIdsByKey = new Map(
      insertedDenominations.map((denomination) => [
        denominationKey(
          denomination.currencyId,
          normalizedDenominationLabels.get(denomination.label) ?? ""
        ),
        denomination.id,
      ])
    )
    const insertedAuthorities =
      document.authorities.length === 0
        ? []
        : await transaction
            .insert(rulingAuthorities)
            .values(document.authorities)
            .returning({
              id: rulingAuthorities.id,
              slug: rulingAuthorities.slug,
            })
    const authorityIdsBySlug = new Map(
      insertedAuthorities.map((authority) => [authority.slug, authority.id])
    )
    const insertedEngravers =
      document.engravers.length === 0
        ? []
        : await transaction
            .insert(engravers)
            .values(document.engravers)
            .returning({ id: engravers.id, slug: engravers.slug })
    const engraverIdsBySlug = new Map(
      insertedEngravers.map((engraver) => [engraver.slug, engraver.id])
    )
    const insertedIssuers = await transaction
      .insert(issuers)
      .values(document.issuers)
      .returning({ id: issuers.id, code: issuers.code })
    const issuerIdsByCode = new Map(
      insertedIssuers.map((issuer) => [issuer.code, issuer.id])
    )

    const coinRecords = document.coins.map(
      ({
        issuerCode,
        denomination,
        obverse: _obverse,
        reverse: _reverse,
        edge: _edge,
        rulingAuthorityAttributions: _rulingAuthorityAttributions,
        ...coin
      }) => {
        const issuerId = issuerIdsByCode.get(issuerCode)
        if (!issuerId) {
          throw new Error(`Coin references unknown Issuer Code: ${issuerCode}`)
        }
        const currencyId = denomination
          ? currencyIdsBySlug.get(denomination.currencySlug)
          : undefined
        const denominationId =
          denomination && currencyId
            ? denominationIdsByKey.get(
                denominationKey(
                  currencyId,
                  normalizedDenominationLabels.get(denomination.label) ?? ""
                )
              )
            : undefined
        if (denomination && !denominationId) {
          throw new Error(
            `Coin references unknown Denomination: ${denomination.currencySlug} / ${denomination.label}`
          )
        }
        return { ...coin, issuerId, denominationId: denominationId ?? null }
      }
    )
    if (coinRecords.length > 0) {
      await transaction.insert(coins).values(coinRecords)
    }

    const attributions = document.coins.flatMap((coin) =>
      coin.rulingAuthorityAttributions.map((attribution) => {
        const rulingAuthorityId = authorityIdsBySlug.get(attribution.slug)
        if (!rulingAuthorityId) {
          throw new Error(
            `Coin references unknown Ruling Authority Slug: ${attribution.slug}`
          )
        }
        return {
          coinId: coin.id,
          rulingAuthorityId,
          role: attribution.role,
          tenure: attribution.tenure ?? null,
          position: attribution.position,
        }
      })
    )
    if (attributions.length > 0) {
      await transaction
        .insert(coinRulingAuthorityAttributions)
        .values(attributions)
    }

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
          if (!surface?.engraverSlugs) return []
          const coinSurfaceId = surfaceIds.get(`${coin.id}:${kind}`)
          if (!coinSurfaceId) throw new Error(`Missing seeded ${kind}`)
          return surface.engraverSlugs.map((engraverSlug, index) => {
            const engraverId = engraverIdsBySlug.get(engraverSlug)
            if (!engraverId) {
              throw new Error(
                `Coin Surface references unknown Engraver Slug: ${engraverSlug}`
              )
            }
            return { coinSurfaceId, engraverId, position: index + 1 }
          })
        })
      )
      if (credits.length > 0) {
        await transaction.insert(coinSurfaceEngravers).values(credits)
      }
    }
  })
}

async function readSeedFile(path: URL) {
  return JSON.parse(await readFile(path, "utf8")) as unknown
}

export async function readCoinSeed(
  seedDirectory = new URL("../seed/", import.meta.url)
) {
  const [
    issuerSeedData,
    currencySeedData,
    denominationSeedData,
    engraverSeedData,
    authoritySeedData,
    coinSeedData,
  ] = await Promise.all([
    readSeedFile(new URL("issuers.json", seedDirectory)),
    readSeedFile(new URL("currencies.json", seedDirectory)),
    readSeedFile(new URL("denominations.json", seedDirectory)),
    readSeedFile(new URL("engravers.json", seedDirectory)),
    readSeedFile(new URL("authorities.json", seedDirectory)),
    readSeedFile(new URL("coins.json", seedDirectory)),
  ])

  return {
    issuers: issuerSeedData,
    currencies: currencySeedData,
    denominations: denominationSeedData,
    engravers: engraverSeedData,
    authorities: authoritySeedData,
    coins: coinSeedData,
  }
}
