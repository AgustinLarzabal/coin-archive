import { getAutoSelectedFilterOperator } from "@coin-archive/ui/components/reui/filters/filters-operators"
import { expect, it } from "vitest"

it("selects only an opted-in field's sole operator", () => {
  const is = { value: "is", label: "is" }
  const field = { id: "issuer", label: "Issuer", autoSelectOperator: true }

  expect(getAutoSelectedFilterOperator(field, [is])).toBe(is)
  expect(
    getAutoSelectedFilterOperator(field, [
      is,
      { value: "is_not", label: "is not" },
    ])
  ).toBeUndefined()
  expect(
    getAutoSelectedFilterOperator({ ...field, autoSelectOperator: false }, [is])
  ).toBeUndefined()
})
