import { Link } from "@tanstack/react-router"
import type { DatabaseGeneralSummaryCounts } from "@workspace/db"

import { databaseMaintenanceSections } from "../navigation"

type DatabaseOverviewTableProps = {
  counts: DatabaseGeneralSummaryCounts
}

export function DatabaseOverviewTable({
  counts,
}: DatabaseOverviewTableProps) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b">
          <th className="py-2 pr-4 font-medium">Record type</th>
          <th className="py-2 font-medium">Count</th>
        </tr>
      </thead>
      <tbody>
        {databaseMaintenanceSections.map((section) => (
          <tr key={section.to} className="border-b last:border-b-0">
            <td className="py-3 pr-4">
              <Link to={section.to} className="underline underline-offset-4">
                {section.label}
              </Link>
            </td>
            <td className="py-3">{counts[section.countKey]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
