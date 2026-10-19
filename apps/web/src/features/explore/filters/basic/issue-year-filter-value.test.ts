import { describe, expect, it } from "vitest"

import {
  formatIssueYearFilterValue,
  parseIssueYearFilterValue,
} from "./issue-year-filter-value"

describe("Issue Year filter value", () => {
  it.each([
    ["1986", 1986],
    ["44 BCE", -44],
    ["  44   bCe  ", -44],
    ["1986-1990", "1986-1990"],
    ["1986 – 1990", "1986-1990"],
    ["400-300 BCE", "-400--300"],
    ["25 BCE-19 CE", "-25-19"],
    ["1986-1986", "1986-1986"],
  ] as const)("parses %j as %j", (draft, expected) => {
    expect(parseIssueYearFilterValue(draft)).toEqual(expected)
  })

  it.each(["", "0", "-44", "44 AD", "1986-", "1990-1986"])(
    "rejects %j",
    (draft) => {
      expect(parseIssueYearFilterValue(draft)).toBeUndefined()
    }
  )

  it.each([
    [undefined, ""],
    [1986, "1986"],
    [-44, "44 BCE"],
    ["-400--300", "400–300 BCE"],
    ["-25-19", "25 BCE–19 CE"],
    ["1986-1990", "1986–1990"],
  ] as const)("formats %j as %j", (value, expected) => {
    expect(formatIssueYearFilterValue(value)).toBe(expected)
  })
})
