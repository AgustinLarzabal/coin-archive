import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { DistributionOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { DistributionsTable } from "@/components/tables/distributions/distributions-table"
import { getAuthSession } from "@/lib/auth-session"
import {
  type DistributionAuthorizationErrorResult,
  createDistributionAuthorizationError,
  hasDistributionMaintenanceAccess,
} from "@/lib/distribution-maintenance"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadDistributionMaintenanceDistributionsResult =
  | DistributionAuthorizationErrorResult
  | {
      status: "success"
      distributions: DistributionOption[]
    }

type DistributionMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      distributions: DistributionOption[]
    }

type DistributionReadDependencies = {
  getDistributions: () => Promise<DistributionOption[]>
}

async function getDefaultDistributionReadDependencies(): Promise<DistributionReadDependencies> {
  const { getDistributions } = await import("@workspace/db")

  return {
    getDistributions,
  }
}

export async function loadDistributionMaintenanceDistributions(
  collector: CollectorWithRole | null,
  dependencies?: DistributionReadDependencies
): Promise<LoadDistributionMaintenanceDistributionsResult> {
  if (!hasDistributionMaintenanceAccess(collector)) {
    return createDistributionAuthorizationError()
  }

  const { getDistributions } =
    dependencies ?? (await getDefaultDistributionReadDependencies())

  return {
    status: "success",
    distributions: await getDistributions(),
  }
}

const getDistributionMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadDistributionMaintenanceDistributions(
    session?.user ?? null
  )

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies DistributionMaintenanceLoaderData
  }

  return {
    isAllowed: true,
    distributions: result.distributions,
  } satisfies DistributionMaintenanceLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/distributions")({
  loader: () => getDistributionMaintenanceLoaderData(),
  component: DatabaseDistributionsComponent,
})

function DatabaseDistributionsComponent() {
  const loaderData = Route.useLoaderData()

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
