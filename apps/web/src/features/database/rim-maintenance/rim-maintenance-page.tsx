import { createServerFn } from "@tanstack/react-start"
import type { RimOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createRimAuthorizationError, hasRimMaintenanceAccess } from "./actions"
import { RimsTable } from "./table-workflow/rims-table"

type LoadResult =
  | ReturnType<typeof createRimAuthorizationError>
  | {
      status: "success"
      rims: RimOption[]
    }

type LoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      rims: RimOption[]
    }

type ReadDependencies = {
  getRims: () => Promise<RimOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getRims } = await import("@workspace/db")

  return {
    getRims,
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
    rims: result.rims,
  }
}

export async function loadRimMaintenanceRims(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasRimMaintenanceAccess(collector)) {
    return createRimAuthorizationError()
  }

  const { getRims } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    rims: await getRims(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadRimMaintenanceRims(session?.user ?? null)

  return toLoaderData(result)
})

export function loadRimMaintenanceRouteData() {
  return getLoaderData()
}

type RimMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function RimMaintenanceRouteComponent({
  loaderData,
}: RimMaintenanceRouteComponentProps) {
  return renderRimMaintenancePage(loaderData)
}

export function renderRimMaintenancePage(loaderData: LoaderData) {
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <RimsTable rims={loaderData.rims} />
    </main>
  )
}
