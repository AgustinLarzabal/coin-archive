import { createServerFn } from "@tanstack/react-start"
import type { RimOption } from "@workspace/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  renderMaintenancePage,
  toMaintenancePageLoaderData,
} from "../maintenance-page"
import type {
  MaintenancePageLoaderData,
  MaintenancePageLoadResult,
} from "../maintenance-page"
import { createRimAuthorizationError, hasRimMaintenanceAccess } from "./actions"
import { RimsTable } from "./table-workflow/rims-table"

type LoadResult = MaintenancePageLoadResult<
  {
    rims: RimOption[]
  },
  ReturnType<typeof createRimAuthorizationError>
>

type LoaderData = MaintenancePageLoaderData<{
  rims: RimOption[]
}>

type ReadDependencies = {
  getRims: () => Promise<RimOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getRims } = await import("@workspace/db")

  return {
    getRims,
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

  return toMaintenancePageLoaderData(result)
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
  return renderMaintenancePage(loaderData, ({ rims }) => (
    <main className="mt-8">
      <RimsTable rims={rims} />
    </main>
  ))
}
