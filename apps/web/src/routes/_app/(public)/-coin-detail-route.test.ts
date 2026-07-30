import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPublicApiClient } from "@/lib/public-api.server"
import { getPublicCoinDetail } from "./coins.$coinId"

vi.mock("@/lib/public-api.server", () => ({ getPublicApiClient: vi.fn() }))

const detail = vi.fn()

describe("public Coin detail route", () => {
  beforeEach(() => {
    detail.mockReset()
    vi.mocked(getPublicApiClient).mockReturnValue({
      coins: { detail },
    } as unknown as ReturnType<typeof getPublicApiClient>)
  })

  it("uses the shared API client to retrieve a Coin by UUID", async () => {
    detail.mockResolvedValue({
      data: { id: "018f1a11-aaaa-7000-8000-000000000001" },
    })

    await expect(
      getPublicCoinDetail("018f1a11-aaaa-7000-8000-000000000001")
    ).resolves.toMatchObject({ id: "018f1a11-aaaa-7000-8000-000000000001" })
    expect(detail).toHaveBeenCalledWith({
      uuid: "018f1a11-aaaa-7000-8000-000000000001",
    })
  })
})
