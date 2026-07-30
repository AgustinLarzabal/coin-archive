import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPublicApiClient } from "@/lib/public-api.server"
import { loadCoinDetail } from "./-coin-detail.server"

vi.mock("@/lib/public-api.server", () => ({ getPublicApiClient: vi.fn() }))

const detail = vi.fn()

describe("public Coin detail route", () => {
  beforeEach(() => {
    detail.mockReset()
    vi.mocked(getPublicApiClient).mockReturnValue({
      coins: { detail },
    } as unknown as ReturnType<typeof getPublicApiClient>)
  })

  it("server-renders a Coin retrieved by UUID through the shared API client", async () => {
    detail.mockResolvedValue({
      data: { id: "018f1a11-aaaa-7000-8000-000000000001" },
    })

    await expect(
      loadCoinDetail("018f1a11-aaaa-7000-8000-000000000001")
    ).resolves.toMatchObject({ id: "018f1a11-aaaa-7000-8000-000000000001" })
    expect(detail).toHaveBeenCalledWith({
      uuid: "018f1a11-aaaa-7000-8000-000000000001",
    })
  })

  it("keeps the public not-found experience when the API returns 404", async () => {
    detail.mockRejectedValue({ status: 404 })

    await expect(
      loadCoinDetail("018f1a11-aaaa-7000-8000-000000000001")
    ).rejects.toMatchObject({ isNotFound: true })
  })
})
