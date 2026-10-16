import type {
  CoinDetailResponse,
  CoinSurfaceResponse,
  CoinSurfaceWithEngraversResponse,
} from "@workspace/api"

export function coinSurfaceWithEngraversFixture(
  overrides: Partial<CoinSurfaceWithEngraversResponse> = {}
): CoinSurfaceWithEngraversResponse {
  return {
    description: null,
    imageUrl: null,
    createdAt: null,
    updatedAt: null,
    engravers: [],
    ...overrides,
  }
}

export function coinEdgeFixture(
  overrides: Partial<CoinSurfaceResponse> = {}
): CoinSurfaceResponse {
  return {
    description: null,
    imageUrl: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

export function coinDetailFixture(
  overrides: Partial<CoinDetailResponse> = {}
): CoinDetailResponse {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    title: "First coin",
    firstIssueYear: 2004,
    lastIssueYear: 2004,
    issuer: { name: "Argentina", code: "AR" },
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
    rulers: [],
    obverse: coinSurfaceWithEngraversFixture(),
    reverse: coinSurfaceWithEngraversFixture(),
    edge: coinEdgeFixture(),
    ...overrides,
  }
}
