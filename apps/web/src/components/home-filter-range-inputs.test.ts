import { describe, expect, it } from "vitest"
import {
  getDiameterRangeValue,
  getFaceValueRangeValue,
  getIssueYearRangeValue,
  getThicknessRangeValue,
  getWeightRangeValue,
  issueYearBounds,
} from "./home-filter-range-inputs"

describe("home filter range input validation", () => {
  it("falls back when the issue year range payload is malformed", () => {
    expect(getIssueYearRangeValue({ min: "1999", max: 2024 })).toEqual({
      min: issueYearBounds.min,
      max: issueYearBounds.max,
    })
  })

  it("preserves valid face value ranges", () => {
    expect(
      getFaceValueRangeValue({ minValue: "1.50", maxValue: 2.75 })
    ).toEqual({
      minValue: "1.50",
      maxValue: 2.75,
    })
  })

  it("falls back when measurement range keys contain invalid values", () => {
    expect(
      getWeightRangeValue({ minWeight: {}, maxWeight: 2.5 })
    ).toEqual({
      minWeight: undefined,
      maxWeight: undefined,
    })

    expect(
      getDiameterRangeValue({ minDiameter: 1.2, maxDiameter: [] })
    ).toEqual({
      minDiameter: undefined,
      maxDiameter: undefined,
    })

    expect(
      getThicknessRangeValue({ minThickness: null, maxThickness: false })
    ).toEqual({
      minThickness: undefined,
      maxThickness: undefined,
    })
  })
})
