import { renderMaintenancePage } from "../maintenance-page"
import type { MintingTechniqueMaintenancePageLoaderData } from "./minting-technique-maintenance-route-data"
import { MintingTechniquesTable } from "./table-workflow/minting-techniques-table"

type MintingTechniqueMaintenanceRouteComponentProps = {
  loaderData: MintingTechniqueMaintenancePageLoaderData
}

export function MintingTechniqueMaintenanceRouteComponent({
  loaderData,
}: MintingTechniqueMaintenanceRouteComponentProps) {
  return renderMintingTechniqueMaintenancePage(loaderData)
}

export function renderMintingTechniqueMaintenancePage(
  loaderData: MintingTechniqueMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ mintingTechniques }) => (
    <main className="mt-8">
      <MintingTechniquesTable mintingTechniques={mintingTechniques} />
    </main>
  ))
}
