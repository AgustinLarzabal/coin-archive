import { createServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@workspace/db"

import { CataloguesTable } from "@/components/catalogues-table"

export const databaseSecondaryMenuItems = [
  { to: "/database", label: "General" },
  { to: "/database/catalogues", label: "Catalogs" },
] as const

type CatalogueMaintenancePageProps = {
  catalogues: CatalogueOption[]
}

export const getCatalogueMaintenanceCatalogues = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getCatalogues } = await import("@workspace/db")

  return getCatalogues()
})

export function CatalogueMaintenancePage({
  catalogues,
}: CatalogueMaintenancePageProps) {
  return <CataloguesTable catalogues={catalogues} />
}

export function CatalogueMaintenanceAccessDeniedPage() {
  return (
    <div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground">
          Only Editors and Admins can access catalogue maintenance.
        </p>
      </div>
    </div>
  )
}
