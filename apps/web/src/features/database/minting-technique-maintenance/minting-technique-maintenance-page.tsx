import { createServerFn } from "@tanstack/react-start"
import type { TechniqueOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createMintingTechniqueAuthorizationError, hasMintingTechniqueMaintenanceAccess } from "./actions"
import { MintingTechniquesTable } from "./table-workflow/minting-techniques-table"

type LoadResult =
  | ReturnType<typeof createMintingTechniqueAuthorizationError>
  | {
      status: "success"
      mintingTechniques: TechniqueOption[]
    }

type LoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      mintingTechniques: TechniqueOption[]
    }

type ReadDependencies = {
  getTechniques: () => Promise<TechniqueOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getTechniques } = await import("@workspace/db")

  return {
    getTechniques,
  }
}

function toLoaderData(result: Awaited<LoadResult>): LoaderData {
  if (result.status === "error") {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed: true,
    mintingTechniques: result.mintingTechniques,
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
  const result = await loadMintingTechniqueMaintenanceMintingTechniques(session?.user ?? null)

  return toLoaderData(result)
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
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <MintingTechniquesTable mintingTechniques={loaderData.mintingTechniques} />
    </main>
  )
}
