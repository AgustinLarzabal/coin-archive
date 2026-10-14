function formatIssueYear(year: number) {
  return year < 0 ? `${Math.abs(year)} BCE` : String(year)
}

export function formatIssuePeriod(
  firstIssueYear: number,
  lastIssueYear: number
) {
  const first = formatIssueYear(firstIssueYear)
  return firstIssueYear === lastIssueYear
    ? first
    : `${first}–${formatIssueYear(lastIssueYear)}`
}
