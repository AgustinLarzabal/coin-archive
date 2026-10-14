function formatIssueYear(year: number) {
  return year < 0 ? `${Math.abs(year)} BCE` : String(year)
}

export function formatIssuePeriod(
  firstIssueYear: number,
  lastIssueYear: number
) {
  const first = formatIssueYear(firstIssueYear)
  if (firstIssueYear === lastIssueYear) return first
  if (lastIssueYear < 0) {
    return `${Math.abs(firstIssueYear)}–${Math.abs(lastIssueYear)} BCE`
  }
  if (firstIssueYear < 0) {
    return `${first}–${lastIssueYear} CE`
  }

  return `${first}–${formatIssueYear(lastIssueYear)}`
}
