import { Link } from "@tanstack/react-router"
import type { DatabaseGeneralSummaryCounts } from "@workspace/db"

const summaryRecordTypes = [
  {
    countKey: "catalogues",
    label: "Catalogues",
    href: "/database/catalogues",
  },
  {
    countKey: "compositions",
    label: "Compositions",
    href: "/database/compositions",
  },
  {
    countKey: "currencies",
    label: "Currencies",
    href: "/database/currencies",
  },
  {
    countKey: "distributions",
    label: "Distributions",
    href: "/database/distributions",
  },
] as const

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
        {summaryRecordTypes.map((recordType) => (
          <tr key={recordType.href} className="border-b last:border-b-0">
            <td className="py-3 pr-4">
              <Link
                to={recordType.href}
                className="underline underline-offset-4"
              >
                {recordType.label}
              </Link>
            </td>
            <td className="py-3">{counts[recordType.countKey]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
