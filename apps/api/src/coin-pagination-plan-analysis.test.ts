import { describe, expect, it } from "vitest"

import { analyzePaginationPlan } from "./coin-pagination-plan-analysis.js"
import type {
  ExplainOutput,
  PlanExpectation,
} from "./coin-pagination-plan-analysis.js"

const orderedExpectation: PlanExpectation = {
  forbiddenSequentialScanRelations: ["coins"],
  label: "unfiltered-first",
  maxApiDurationMs: 1_000,
  maxExecutionMs: 500,
  maxPlanRows: 1_000,
  maxReturnedRows: 100,
  maxRowsRemovedByFilter: 500,
  maxSharedBlocks: 1_000,
  maxSortRows: 0,
  requiredIndexes: ["coins_created_at_id_index"],
}

function explain(plan: ExplainOutput["Plan"]): ExplainOutput {
  return {
    "Execution Time": 12,
    Plan: plan,
    "Planning Time": 0.2,
  }
}

describe("pagination plan analysis", () => {
  it("accepts bounded work on the documented ordering index", () => {
    const result = analyzePaginationPlan({
      apiDurationMs: 25,
      expectation: orderedExpectation,
      explain: explain({
        "Actual Loops": 1,
        "Actual Rows": 100,
        "Node Type": "Limit",
        Plans: [
          {
            "Actual Loops": 1,
            "Actual Rows": 100,
            "Index Name": "coins_created_at_id_index",
            "Node Type": "Index Scan",
            "Relation Name": "coins",
          },
        ],
        "Shared Hit Blocks": 42,
        "Shared Read Blocks": 3,
      }),
    })

    expect(result.summary).toEqual({
      indexes: ["coins_created_at_id_index"],
      planRows: 200,
      returnedRows: 100,
      rowsRemovedByFilter: 0,
      sharedBlocks: 45,
      sortRows: 0,
    })
    expect(result.violations).toEqual([])
  })

  it("rejects a full scan, sort, and excessive database work", () => {
    const result = analyzePaginationPlan({
      apiDurationMs: 25,
      expectation: { ...orderedExpectation, requiredIndexes: [] },
      explain: explain({
        "Actual Loops": 1,
        "Actual Rows": 101,
        "Node Type": "Limit",
        Plans: [
          {
            "Actual Loops": 1,
            "Actual Rows": 100_000,
            "Node Type": "Sort",
            Plans: [
              {
                "Actual Loops": 1,
                "Actual Rows": 100_000,
                "Node Type": "Seq Scan",
                "Relation Name": "coins",
                "Rows Removed by Filter": 900_000,
              },
            ],
          },
        ],
        "Shared Hit Blocks": 1_500,
      }),
    })

    expect(result.violations.map(({ metric }) => metric)).toEqual([
      "returnedRows",
      "planRows",
      "rowsRemovedByFilter",
      "sharedBlocks",
      "sortRows",
      "sequentialScan",
    ])
  })

  it("reports a missing required index", () => {
    const result = analyzePaginationPlan({
      apiDurationMs: 25,
      expectation: orderedExpectation,
      explain: explain({
        "Actual Loops": 1,
        "Actual Rows": 100,
        "Node Type": "Limit",
        Plans: [
          {
            "Actual Loops": 1,
            "Actual Rows": 100,
            "Index Name": "coins_pkey",
            "Node Type": "Index Scan",
            "Relation Name": "coins",
          },
        ],
      }),
    })

    expect(result.violations).toContainEqual({
      actual: "coins_pkey",
      bound: "coins_created_at_id_index",
      label: "unfiltered-first",
      metric: "requiredIndex",
    })
  })

  it("rejects order-of-magnitude execution and API duration regressions", () => {
    const slowExplain = explain({
      "Actual Loops": 1,
      "Actual Rows": 100,
      "Index Name": "coins_created_at_id_index",
      "Node Type": "Index Scan",
      "Relation Name": "coins",
    })
    slowExplain["Execution Time"] = 501

    const result = analyzePaginationPlan({
      apiDurationMs: 1_001,
      expectation: orderedExpectation,
      explain: slowExplain,
    })

    expect(result.violations.map(({ metric }) => metric)).toEqual([
      "executionMs",
      "apiDurationMs",
    ])
  })
})
