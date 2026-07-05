import { createServerFn } from "@tanstack/react-start"
import type { TechniqueOption } from "@workspace/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  type MaintenancePageLoaderData,
  type MaintenancePageLoadResult,
  renderMaintenancePage,
  toMaintenancePageLoaderData,
} from "../maintenance-page"
import { createMintingTechniqueAuthorizationError, hasMintingTechniqueMaintenanceAccess } from "./actions"
import { MintingTechniquesTable } from "./table-workflow/minting-techniques-table"

type LoadResult = MaintenancePageLoadResult<{
  mintingTechniques: TechniqueOption[]
}, ReturnType<typeof createMintingTechniqueAuthorizationError>>

type LoaderData = MaintenancePageLoaderData<{
  mintingTechniques: TechniqueOption[]
}>

type ReadDependencies = {
  getTechniques: () => Promise<TechniqueOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getTechniques } = await import("@workspace/db")

  return {
    getTechniques,
  }
}

export async function loadMintingTechniqueMaintenanceMintingTechniques(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasMintingTechniqueMaintenanceAccess(collector)) {
    return createMintingTechniqueAuthorizationError()
  }

  const { getTechniques } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    mintingTechniques: await getTechniques(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadMintingTechniqueMaintenanceMintingTechniques(
    session?.user ?? null
  )

  return toMaintenancePageLoaderData(result)
})

export function loadMintingTechniqueMaintenanceRouteData() {
  return getLoaderData()
}

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
