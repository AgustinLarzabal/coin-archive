import { renderMaintenancePage } from "../maintenance-page"
import type { LoaderData } from "./minting-technique-maintenance-route-data"
import { MintingTechniquesTable } from "./table-workflow/minting-techniques-table"

type MintingTechniqueMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function MintingTechniqueMaintenanceRouteComponent({
  loaderData,
}: MintingTechniqueMaintenanceRouteComponentProps) {
  return renderMintingTechniqueMaintenancePage(loaderData)
}

export function renderMintingTechniqueMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ mintingTechniques }) => (
    <main className="mt-8">
      <MintingTechniquesTable mintingTechniques={mintingTechniques} />
    </main>
  ))
}
