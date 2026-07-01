import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { MintOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { MintsTable } from "@/components/tables/mints/mints-table"
import { getAuthSession } from "@/lib/auth-session"
import {
  type MintAuthorizationErrorResult,
  createMintAuthorizationError,
  hasMintMaintenanceAccess,
} from "@/lib/mint-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadMintMaintenanceMintsResult =
  | MintAuthorizationErrorResult
  | {
      status: "success"
      mints: MintOption[]
    }

type MintMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      mints: MintOption[]
    }

type MintReadDependencies = {
  getMints: () => Promise<MintOption[]>
}

async function getDefaultMintReadDependencies(): Promise<MintReadDependencies> {
  const { getMints } = await import("@workspace/db")

  return {
    getMints,
  }
}

async function resolveMintReadDependencies(
  dependencies?: MintReadDependencies
): Promise<MintReadDependencies> {
  return dependencies ?? getDefaultMintReadDependencies()
}

export async function loadMintMaintenanceMints(
  collector: CollectorWithRole | null,
  dependencies?: MintReadDependencies
): Promise<LoadMintMaintenanceMintsResult> {
  if (!hasMintMaintenanceAccess(collector)) {
    return createMintAuthorizationError()
  }

  const { getMints } = await resolveMintReadDependencies(dependencies)

  return {
    status: "success",
    mints: await getMints(),
  }
}

const getMintMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadMintMaintenanceMints(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies MintMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    mints: result.mints,
  } satisfies MintMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/mints")({
  loader: () => getMintMaintenanceLoaderData(),
  component: DatabaseMintsComponent,
})

function DatabaseMintsComponent() {
  return renderDatabaseMintsPage(Route.useLoaderData())
}

export function renderDatabaseMintsPage(loaderData: MintMaintenanceLoaderData) {
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <MintsTable mints={loaderData.mints} />
    </main>
  )
}
