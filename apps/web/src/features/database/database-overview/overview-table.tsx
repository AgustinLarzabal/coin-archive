import { Link } from "@tanstack/react-router"
import type { DatabaseMaintenanceOverview } from "@coin-archive/api"

import { databaseMaintenanceSections } from "../navigation"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@coin-archive/ui/components/item"

type DatabaseOverviewTableProps = {
  counts: DatabaseMaintenanceOverview
}

export function DatabaseOverviewTable({ counts }: DatabaseOverviewTableProps) {
  return (
    <ItemGroup className="grid w-full grid-cols-4 gap-6">
      {databaseMaintenanceSections.map((section) => {
        const Icon = section.icon

        return (
          <Item
            key={section.to}
            variant="outline"
            render={
              <Link to={section.to}>
                <ItemHeader>
                  <ItemMedia variant="icon" className="bg-muted p-2">
                    <Icon className="size-5 text-emerald-400" />
                  </ItemMedia>
                </ItemHeader>
                <ItemContent>
                  <ItemTitle className="font-mono text-2xl leading-none font-bold">
                    {counts[section.countKey]}
                  </ItemTitle>
                  <ItemDescription className="text-sm text-muted-foreground">
                    {section.label}
                  </ItemDescription>
                </ItemContent>
              </Link>
            }
          />
        )
      })}
    </ItemGroup>
  )
}
