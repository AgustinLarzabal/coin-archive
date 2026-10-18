import type {
  CoinDetailResponse,
  CoinFaceValueResponse,
  CoinListItemResponse,
  CoinSurfaceResponse,
  CoinSurfaceWithEngraversResponse,
} from "@workspace/api"

export function coinFaceValueFixture(
  overrides: Partial<CoinFaceValueResponse> = {}
): CoinFaceValueResponse {
  return {
    label: "1 peso",
    numericValue: 1,
    currency: {
      slug: "argentine-peso-convertible",
      name: "Peso",
      fullName: "Peso (1992–2001)",
    },
    ...overrides,
  }
}

export function coinListItemFixture(
  overrides: Partial<CoinListItemResponse> = {}
): CoinListItemResponse {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    title: "First coin",
    distribution: "circulating-commemorative",
    firstIssueYear: 2004,
    lastIssueYear: 2004,
    issuer: { name: "Argentina", code: "AR" },
    faceValue: null,
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T11:00:00.000Z",
    obverseImageUrl: null,
    reverseImageUrl: null,
    ...overrides,
  }
}

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
    distribution: "circulating-commemorative",
    firstIssueYear: 2004,
    lastIssueYear: 2004,
    issuer: { name: "Argentina", code: "AR" },
    faceValue: null,
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:00:00.000Z",
    rulers: [],
    obverse: coinSurfaceWithEngraversFixture(),
    reverse: coinSurfaceWithEngraversFixture(),
    edge: coinEdgeFixture(),
    ...overrides,
  }
}
