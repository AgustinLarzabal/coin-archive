import { expect, it, vi } from "vitest"

import {
  currencyListQueryOptions,
  CurrencyListRequestError,
  InvalidCurrencyListResponseError,
} from "./currencies"

it("uses an independent reusable cache key and strictly validates Currencies", async () => {
  const options = currencyListQueryOptions()
  expect(options.queryKey).toEqual(["currencies", "list"])
  expect(options.staleTime).toBe(Infinity)

  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        currencies: [
          {
            slug: "euro",
            name: "Euro",
            fullName: "Euro (1999–present)",
          },
        ],
      })
    )
  )
  await expect(options.queryFn?.({} as never)).resolves.toEqual({
    currencies: [
      { slug: "euro", name: "Euro", fullName: "Euro (1999–present)" },
    ],
  })

  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        currencies: [
          {
            slug: "euro",
            name: "Euro",
            fullName: "Euro (1999–present)",
            periodLabel: "must stay private",
          },
        ],
      })
    )
  )
  await expect(options.queryFn?.({} as never)).rejects.toBeInstanceOf(
    InvalidCurrencyListResponseError
  )
})

it("distinguishes Currency request failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 503 }))
  )

  await expect(
    currencyListQueryOptions().queryFn?.({} as never)
  ).rejects.toBeInstanceOf(CurrencyListRequestError)
})
