import { Link } from "@tanstack/react-router"
import type { DatabaseGeneralSummaryCounts } from "@workspace/db"

type DatabaseGeneralSummaryRow = {
  count: number
  href: "/database/catalogues" | "/database/compositions" | "/database/currencies" | "/database/distributions"
  label: "Catalogues" | "Compositions" | "Currencies" | "Distributions"
}

const tableRows = (
  counts: DatabaseGeneralSummaryCounts
): DatabaseGeneralSummaryRow[] => [
  {
    label: "Catalogues",
    href: "/database/catalogues",
    count: counts.catalogues,
  },
  {
    label: "Compositions",
    href: "/database/compositions",
    count: counts.compositions,
  },
  {
    label: "Currencies",
    href: "/database/currencies",
    count: counts.currencies,
  },
  {
    label: "Distributions",
    href: "/database/distributions",
    count: counts.distributions,
  },
]

export function DatabaseGeneralSummaryTable({
  counts,
}: {
  counts: DatabaseGeneralSummaryCounts
}) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b">
          <th className="py-2 pr-4 font-medium">Record type</th>
          <th className="py-2 font-medium">Count</th>
        </tr>
      </thead>
      <tbody>
        {tableRows(counts).map((row) => (
          <tr key={row.href} className="border-b last:border-b-0">
            <td className="py-3 pr-4">
              <Link to={row.href} className="underline underline-offset-4">
                {row.label}
              </Link>
            </td>
            <td className="py-3">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
