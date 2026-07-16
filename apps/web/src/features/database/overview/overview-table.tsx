import { Link } from "@tanstack/react-router"
import type { DatabaseGeneralSummaryCounts } from "@workspace/db"

import { databaseMaintenanceSections } from "../navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type DatabaseOverviewTableProps = {
  counts: DatabaseGeneralSummaryCounts
}

export function DatabaseOverviewTable({ counts }: DatabaseOverviewTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Record type</TableHead>
          <TableHead>Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {databaseMaintenanceSections.map((section) => (
          <TableRow key={section.to}>
            <TableCell>
              <Link to={section.to} className="underline underline-offset-4">
                {section.label}
              </Link>
            </TableCell>
            <TableCell>{counts[section.countKey]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
