import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPublicApiClient } from "@/lib/public-api.server"
import { getPublicCoinList } from "./index"

vi.mock("@/lib/public-api.server", () => ({
  getPublicApiClient: vi.fn(),
}))

const browse = vi.fn()

describe("public Coin browse route", () => {
  beforeEach(() => {
    browse.mockReset()
    vi.mocked(getPublicApiClient).mockReturnValue({
      coins: { browse },
    } as ReturnType<typeof getPublicApiClient>)
  })

  it("renders Coin summaries returned by the shared API client for Title search and all catalogue filters", async () => {
    browse.mockResolvedValue({
      data: [
        {
          id: "018f1a11-aaaa-7000-8000-000000000001",
          title: "Spanish Euro Commemorative",
          issuer: { code: "spain", isoCode: "ES", name: "Spain" },
          surfaceImages: {
            obverse: "https://images.coinarchive.app/obverse.jpg",
            reverse: null,
            edge: null,
          },
          detailUrl:
            "https://api.coinarchive.app/api/v1/coins/018f1a11-aaaa-7000-8000-000000000001",
        },
      ],
      nextCursor: "opaque-next-page",
    })

    await expect(
      getPublicCoinList({
        distributionCode: "commemorative",
        engraverCode: "ana",
        issuerCode: "spain",
        q: "euro",
        rulerCode: "felipe-vi",
        themeCode: "history",
      })
    ).resolves.toMatchObject({
      coins: [
        {
          title: "Spanish Euro Commemorative",
          issuer: { name: "Spain" },
          surfaces: {
            obverse: {
              imageUrl: "https://images.coinarchive.app/obverse.jpg",
            },
          },
        },
      ],
      nextCursor: "opaque-next-page",
    })

    expect(browse).toHaveBeenCalledWith({
      distribution: "commemorative",
      engraver: "ana",
      issuer: "spain",
      q: "euro",
      ruler: "felipe-vi",
      theme: "history",
    })
  })
})
