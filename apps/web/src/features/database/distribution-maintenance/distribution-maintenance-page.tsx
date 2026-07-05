import { createServerFn } from "@tanstack/react-start"
import type { DistributionOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createDistributionAuthorizationError, hasDistributionMaintenanceAccess } from "./actions"
import { DistributionsTable } from "./table-workflow/distributions-table"

type LoadResult =
  | ReturnType<typeof createDistributionAuthorizationError>
  | {
      status: "success"
      distributions: DistributionOption[]
    }

type LoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      distributions: DistributionOption[]
    }

type ReadDependencies = {
  getDistributions: () => Promise<DistributionOption[]>
}

async function getDefaultReadDependencies(): Promise<ReadDependencies> {
  const { getDistributions } = await import("@workspace/db")

  return {
    getDistributions,
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
    distributions: result.distributions,
  }
}

export async function loadDistributionMaintenanceDistributions(
  collector: CollectorWithRole | null,
  dependencies?: ReadDependencies
): Promise<Awaited<LoadResult>> {
  if (!hasDistributionMaintenanceAccess(collector)) {
    return createDistributionAuthorizationError()
  }

  const { getDistributions } = dependencies ?? (await getDefaultReadDependencies())

  return {
    status: "success",
    distributions: await getDistributions(),
  }
}

const getLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadDistributionMaintenanceDistributions(session?.user ?? null)

  return toLoaderData(result)
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
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <DistributionsTable distributions={loaderData.distributions} />
    </main>
  )
}
