export interface ExplainPlan {
  [key: string]: unknown
  "Actual Loops"?: number
  "Actual Rows"?: number
  "Index Name"?: string
  "Node Type": string
  Plans?: Array<ExplainPlan>
  "Relation Name"?: string
  "Rows Removed by Filter"?: number
  "Shared Hit Blocks"?: number
  "Shared Read Blocks"?: number
  "Sort Method"?: string
}

export interface ExplainOutput {
  "Execution Time": number
  Plan: ExplainPlan
  "Planning Time": number
}

export interface PlanExpectation {
  forbiddenSequentialScanRelations?: Array<string>
  label: string
  maxApiDurationMs: number
  maxExecutionMs: number
  maxPlanRows: number
  maxReturnedRows: number
  maxRowsRemovedByFilter: number
  maxSharedBlocks: number
  maxSortRows?: number
  requiredIndexes?: Array<string>
}

export interface PlanSummary {
  indexes: Array<string>
  planRows: number
  returnedRows: number
  rowsRemovedByFilter: number
  sharedBlocks: number
  sortRows: number
}

export interface PlanViolation {
  actual: number | string
  bound: number | string
  label: string
  metric: string
}

export interface PlanAnalysis {
  summary: PlanSummary
  violations: Array<PlanViolation>
}

function nodeWork(value: number | undefined, loops: number | undefined) {
  return (value ?? 0) * (loops ?? 1)
}

function collectNodes(plan: ExplainPlan): Array<ExplainPlan> {
  return [plan, ...(plan.Plans ?? []).flatMap(collectNodes)]
}

export function analyzePaginationPlan({
  apiDurationMs,
  expectation,
  explain,
}: {
  apiDurationMs: number
  expectation: PlanExpectation
  explain: ExplainOutput
}): PlanAnalysis {
  const nodes = collectNodes(explain.Plan)
  const indexes = [
    ...new Set(
      nodes.flatMap((node) =>
        node["Index Name"] === undefined ? [] : [node["Index Name"]]
      )
    ),
  ]
  const summary: PlanSummary = {
    indexes,
    planRows: nodes.reduce(
      (total, node) =>
        total + nodeWork(node["Actual Rows"], node["Actual Loops"]),
      0
    ),
    returnedRows: nodeWork(
      explain.Plan["Actual Rows"],
      explain.Plan["Actual Loops"]
    ),
    rowsRemovedByFilter: nodes.reduce(
      (total, node) =>
        total + nodeWork(node["Rows Removed by Filter"], node["Actual Loops"]),
      0
    ),
    sharedBlocks:
      (explain.Plan["Shared Hit Blocks"] ?? 0) +
      (explain.Plan["Shared Read Blocks"] ?? 0),
    sortRows: nodes
      .filter((node) => node["Node Type"].endsWith("Sort"))
      .reduce(
        (total, node) =>
          total + nodeWork(node["Actual Rows"], node["Actual Loops"]),
        0
      ),
  }
  const violations: Array<PlanViolation> = []
  const addMaximumViolation = (
    metric: string,
    actual: number,
    bound: number
  ) => {
    if (actual > bound) {
      violations.push({
        actual,
        bound,
        label: expectation.label,
        metric,
      })
    }
  }

  addMaximumViolation(
    "returnedRows",
    summary.returnedRows,
    expectation.maxReturnedRows
  )
  addMaximumViolation("planRows", summary.planRows, expectation.maxPlanRows)
  addMaximumViolation(
    "rowsRemovedByFilter",
    summary.rowsRemovedByFilter,
    expectation.maxRowsRemovedByFilter
  )
  addMaximumViolation(
    "sharedBlocks",
    summary.sharedBlocks,
    expectation.maxSharedBlocks
  )
  if (expectation.maxSortRows !== undefined) {
    addMaximumViolation("sortRows", summary.sortRows, expectation.maxSortRows)
  }

  for (const requiredIndex of expectation.requiredIndexes ?? []) {
    if (!indexes.includes(requiredIndex)) {
      violations.push({
        actual: indexes.join(", ") || "none",
        bound: requiredIndex,
        label: expectation.label,
        metric: "requiredIndex",
      })
    }
  }

  const forbiddenSequentialScans = nodes
    .filter(
      (node) =>
        node["Node Type"] === "Seq Scan" &&
        node["Relation Name"] !== undefined &&
        expectation.forbiddenSequentialScanRelations?.includes(
          node["Relation Name"]
        )
    )
    .map((node) => node["Relation Name"] as string)
  if (forbiddenSequentialScans.length > 0) {
    violations.push({
      actual: [...new Set(forbiddenSequentialScans)].join(", "),
      bound: "no sequential scan",
      label: expectation.label,
      metric: "sequentialScan",
    })
  }

  addMaximumViolation(
    "executionMs",
    explain["Execution Time"],
    expectation.maxExecutionMs
  )
  addMaximumViolation(
    "apiDurationMs",
    apiDurationMs,
    expectation.maxApiDurationMs
  )

  return {
    summary,
    violations,
  }
}
