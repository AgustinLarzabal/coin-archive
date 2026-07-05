import { createServerFn } from "@tanstack/react-start"
import type { MintOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  createMintAuthorizationError,
  hasMintMaintenanceAccess,
  type MintAuthorizationErrorResult,
} from "./actions"
import { MintsTable } from "./mints-table"

type LoadMintMaintenancePageDataResult =
  | MintAuthorizationErrorResult
  | {
      status: "success"
      mints: MintOption[]
    }

type MintMaintenancePageLoaderData =
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

function toMintMaintenanceLoaderData(
  result: LoadMintMaintenancePageDataResult
): MintMaintenancePageLoaderData {
  if (result.status === "error") {
    return { isAllowed: false }
  }

  return {
    isAllowed: true,
    mints: result.mints,
  }
}

export async function loadMintMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: MintReadDependencies
): Promise<LoadMintMaintenancePageDataResult> {
  if (!hasMintMaintenanceAccess(collector)) {
    return createMintAuthorizationError()
  }

  const { getMints } = dependencies ?? (await getDefaultMintReadDependencies())

  return {
    status: "success",
    mints: await getMints(),
  }
}

const getMintMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadMintMaintenancePageData(session?.user ?? null)

  return toMintMaintenanceLoaderData(result)
})

export function loadMintMaintenanceRouteData() {
  return getMintMaintenanceLoaderData()
}

type MintMaintenanceRouteComponentProps = {
  loaderData: MintMaintenancePageLoaderData
}

export function MintMaintenanceRouteComponent({
  loaderData,
}: MintMaintenanceRouteComponentProps) {
  return renderMintMaintenancePage(loaderData)
}

export function renderMintMaintenancePage(
  loaderData: MintMaintenancePageLoaderData
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
      <MintsTable mints={loaderData.mints} />
    </main>
  )
}
