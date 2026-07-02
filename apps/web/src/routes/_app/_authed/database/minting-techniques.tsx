import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { TechniqueOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { MintingTechniquesTable } from "@/components/tables/minting-techniques/minting-techniques-table"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import {
  createMintingTechniqueAuthorizationError,
  hasMintingTechniqueMaintenanceAccess,
} from "@/lib/minting-technique-maintenance"
import type { MintingTechniqueAuthorizationErrorResult } from "@/lib/minting-technique-maintenance"

type LoadMintingTechniqueMaintenanceMintingTechniquesResult =
  | MintingTechniqueAuthorizationErrorResult
  | {
      status: "success"
      mintingTechniques: TechniqueOption[]
    }

type MintingTechniqueMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      mintingTechniques: TechniqueOption[]
    }

type MintingTechniqueReadDependencies = {
  getTechniques: () => Promise<TechniqueOption[]>
}

async function getDefaultMintingTechniqueReadDependencies(): Promise<MintingTechniqueReadDependencies> {
  const { getTechniques } = await import("@workspace/db")

  return {
    getTechniques,
  }
}

async function resolveMintingTechniqueReadDependencies(
  dependencies?: MintingTechniqueReadDependencies
): Promise<MintingTechniqueReadDependencies> {
  return dependencies ?? getDefaultMintingTechniqueReadDependencies()
}

export async function loadMintingTechniqueMaintenanceMintingTechniques(
  collector: CollectorWithRole | null,
  dependencies?: MintingTechniqueReadDependencies
): Promise<LoadMintingTechniqueMaintenanceMintingTechniquesResult> {
  if (!hasMintingTechniqueMaintenanceAccess(collector)) {
    return createMintingTechniqueAuthorizationError()
  }

  const { getTechniques } = await resolveMintingTechniqueReadDependencies(
    dependencies
  )

  return {
    status: "success",
    mintingTechniques: await getTechniques(),
  }
}

const getMintingTechniqueMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadMintingTechniqueMaintenanceMintingTechniques(
    session?.user ?? null
  )

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies MintingTechniqueMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    mintingTechniques: result.mintingTechniques,
  } satisfies MintingTechniqueMaintenanceLoaderData
})

export const Route = createFileRoute(
  "/_app/_authed/database/minting-techniques"
)({
  loader: () => getMintingTechniqueMaintenanceLoaderData(),
  component: DatabaseMintingTechniquesComponent,
})

function DatabaseMintingTechniquesComponent() {
  return renderDatabaseMintingTechniquesPage(Route.useLoaderData())
}

export function renderDatabaseMintingTechniquesPage(
  loaderData: MintingTechniqueMaintenanceLoaderData
) {
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <MintingTechniquesTable
        mintingTechniques={loaderData.mintingTechniques}
      />
    </main>
  )
}
