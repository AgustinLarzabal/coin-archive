import { createServerFn } from "@tanstack/react-start"
import type { DistributionOption } from "@coin-archive/db"

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
import {
  createDistributionAuthorizationError,
  hasDistributionMaintenanceAccess,
} from "./actions"
import { DistributionsTable } from "./table-workflow/distributions-table"

type LoadResult = MaintenancePageLoadResult<
  {
    distributions: DistributionOption[]
  },
  ReturnType<typeof createDistributionAuthorizationError>
>

type LoaderData = MaintenancePageLoaderData<{
  distributions: DistributionOption[]
}>

type ReadDependencies = {
  getDistributions: () => Promise<DistributionOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getDistributions } = await import("@coin-archive/db")

  return {
    getDistributions,
  }
}

export async function loadDistributionMaintenanceDistributions(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasDistributionMaintenanceAccess(collector)) {
    return createDistributionAuthorizationError()
  }

  const { getDistributions } =
    dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    distributions: await getDistributions(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadDistributionMaintenanceDistributions(
    session?.user ?? null
  )

  return toMaintenancePageLoaderData(result)
})

export function loadDistributionMaintenanceRouteData() {
  return getLoaderData()
}

type DistributionMaintenanceRouteComponentProps = {
  loaderData: LoaderData
}

export function DistributionMaintenanceRouteComponent({
  loaderData,
}: DistributionMaintenanceRouteComponentProps) {
  return renderDistributionMaintenancePage(loaderData)
}

export function renderDistributionMaintenancePage(loaderData: LoaderData) {
  return renderMaintenancePage(loaderData, ({ distributions }) => (
    <main className="mt-8">
      <DistributionsTable distributions={distributions} />
    </main>
  ))
}
