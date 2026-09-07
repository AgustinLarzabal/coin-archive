import { expect, it } from "vitest"

type PublicApiContractOptions = {
  exportedNames: readonly string[]
  feature: Record<string, unknown>
}

export function assertFeaturePublicApi({
  exportedNames,
  feature,
}: PublicApiContractOptions) {
  it("only exposes the route-facing feature entrypoint", () => {
    expect(Object.keys(feature).sort()).toStrictEqual(exportedNames)
  })

}
