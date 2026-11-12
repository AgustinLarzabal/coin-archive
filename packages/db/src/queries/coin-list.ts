import { and, asc, count, desc, eq, inArray } from "drizzle-orm"

import * as schema from "../schema/index.js"
import { createCoinFilter } from "./coin-list-filters.js"
import type { CoinListOptions, CoinListPage } from "./coin-list-types.js"
import type { Database } from "../connection.js"

const POSTGRES_INTEGER_MIN = -2_147_483_648
const POSTGRES_INTEGER_MAX = 2_147_483_647

export function createListCoins(orm: Database["orm"]) {
  return async function listCoins(
    listOptions: CoinListOptions = {}
  ): Promise<CoinListPage> {
    const page = listOptions.page ?? 1
    const pageSize = listOptions.pageSize ?? 24

    if (!Number.isSafeInteger(page) || page < 1) {
      throw new RangeError("page must be a positive safe integer")
    }

    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new RangeError("pageSize must be an integer between 1 and 100")
    }

    if (
      listOptions.faceValueAmount !== undefined &&
      listOptions.currencySlug === undefined
    ) {
      throw new RangeError("faceValueAmount requires currencySlug")
    }

    const issueYearInterval = listOptions.issueYearInterval

    if (
      issueYearInterval &&
      (!Number.isSafeInteger(issueYearInterval.firstIssueYear) ||
        !Number.isSafeInteger(issueYearInterval.lastIssueYear) ||
        issueYearInterval.firstIssueYear === 0 ||
        issueYearInterval.lastIssueYear === 0 ||
        issueYearInterval.firstIssueYear > issueYearInterval.lastIssueYear)
    ) {
      throw new RangeError("issueYearInterval must be an ordered interval")
    }

    const persistedIssueYearInterval = issueYearInterval && {
      firstIssueYear: Math.max(
        issueYearInterval.firstIssueYear,
        POSTGRES_INTEGER_MIN
      ),
      lastIssueYear: Math.min(
        issueYearInterval.lastIssueYear,
        POSTGRES_INTEGER_MAX
      ),
    }

    if (
      persistedIssueYearInterval &&
      persistedIssueYearInterval.firstIssueYear >
        persistedIssueYearInterval.lastIssueYear
    ) {
      return { coins: [], totalItems: 0 }
    }

    return orm.transaction(
      async (transaction) => {
        const coinFilterPredicate = createCoinFilter(
          transaction,
          listOptions,
          persistedIssueYearInterval
        )

        const [{ totalItems }] = await transaction
          .select({ totalItems: count() })
          .from(schema.coins)
          .where(coinFilterPredicate())

        const rows = await transaction
          .select({
            coin: schema.coins,
            distribution: schema.distributions.slug,
            issuer: schema.issuers,
            denomination: schema.denominations,
            currency: schema.currencies,
          })
          .from(schema.coins)
          .innerJoin(
            schema.issuers,
            eq(schema.coins.issuerId, schema.issuers.id)
          )
          .innerJoin(
            schema.distributions,
            eq(schema.coins.distributionId, schema.distributions.id)
          )
          .leftJoin(
            schema.denominations,
            eq(schema.coins.denominationId, schema.denominations.id)
          )
          .leftJoin(
            schema.currencies,
            eq(schema.denominations.currencyId, schema.currencies.id)
          )
          .where(coinFilterPredicate())
          .orderBy(desc(schema.coins.createdAt), asc(schema.coins.id))
          .limit(pageSize)
          .offset((page - 1) * pageSize)

        const pageCoinIds = rows.map(({ coin }) => coin.id)
        const surfaceImages =
          pageCoinIds.length === 0
            ? []
            : await transaction
                .select({
                  coinId: schema.coinSurfaces.coinId,
                  imageKey: schema.coinSurfaces.imageKey,
                  kind: schema.coinSurfaces.kind,
                })
                .from(schema.coinSurfaces)
                .where(
                  and(
                    inArray(schema.coinSurfaces.coinId, pageCoinIds),
                    inArray(schema.coinSurfaces.kind, ["obverse", "reverse"])
                  )
                )

        const imagesByCoinId = new Map<
          string,
          { obverse?: string | null; reverse?: string | null }
        >()

        for (const surface of surfaceImages) {
          if (surface.kind === "edge") continue
          const images = imagesByCoinId.get(surface.coinId) ?? {}
          images[surface.kind] = surface.imageKey
          imagesByCoinId.set(surface.coinId, images)
        }

        return {
          coins: rows.map(
            ({ coin, distribution, currency, denomination, issuer }) => {
              const images = imagesByCoinId.get(coin.id)
              const {
                denominationId: _denominationId,
                distributionId: _distributionId,
                compositionId: _compositionId,
                compositionDetail: _compositionDetail,
                demonetized: _demonetized,
                shapeId: _shapeId,
                techniqueId: _techniqueId,
                orientationId: _orientationId,
                ...publicCoin
              } = coin
              return {
                ...publicCoin,
                distribution,
                issuer,
                denomination:
                  denomination && currency
                    ? { ...denomination, currency }
                    : null,
                obverseImageKey: images?.obverse ?? null,
                reverseImageKey: images?.reverse ?? null,
              }
            }
          ),
          totalItems,
        }
      },
      { accessMode: "read only", isolationLevel: "repeatable read" }
    )
  }
}
