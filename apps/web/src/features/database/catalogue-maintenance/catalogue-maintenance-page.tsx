import { createServerFn } from "@tanstack/react-start"
import type { CatalogueOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import {
  createCatalogueAuthorizationError,
  hasCatalogueMaintenanceAccess,
  type CatalogueAuthorizationErrorResult,
} from "./actions"
import { CataloguesTable } from "./table-workflow/catalogues-table"

type LoadCatalogueMaintenancePageDataResult =
  | CatalogueAuthorizationErrorResult
  | {
      status: "success"
      catalogues: CatalogueOption[]
    }

type CatalogueMaintenancePageLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      catalogues: CatalogueOption[]
    }

type CatalogueReadDependencies = {
  getCatalogues: () => Promise<CatalogueOption[]>
}

async function getDefaultCatalogueReadDependencies(): Promise<CatalogueReadDependencies> {
  const { getCatalogues } = await import("@workspace/db")

  return {
    getCatalogues,
  }
}

function toCatalogueMaintenanceLoaderData(
  result: LoadCatalogueMaintenancePageDataResult
): CatalogueMaintenancePageLoaderData {
  if (result.status === "error") {
    return { isAllowed: false }
  }

  return {
    isAllowed: true,
    catalogues: result.catalogues,
  }
}

export async function loadCatalogueMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: CatalogueReadDependencies
): Promise<LoadCatalogueMaintenancePageDataResult> {
  if (!hasCatalogueMaintenanceAccess(collector)) {
    return createCatalogueAuthorizationError()
  }

  const { getCatalogues } =
    dependencies ?? (await getDefaultCatalogueReadDependencies())

  return {
    status: "success",
    catalogues: await getCatalogues(),
  }
}

const getCatalogueMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadCatalogueMaintenancePageData(session?.user ?? null)

  return toCatalogueMaintenanceLoaderData(result)
})

export function loadCatalogueMaintenanceRouteData() {
  return getCatalogueMaintenanceLoaderData()
}

type CatalogueMaintenanceRouteComponentProps = {
  loaderData: CatalogueMaintenancePageLoaderData
}

export function CatalogueMaintenanceRouteComponent({
  loaderData,
}: CatalogueMaintenanceRouteComponentProps) {
  return renderCatalogueMaintenancePage(loaderData)
}

export function renderCatalogueMaintenancePage(
  loaderData: CatalogueMaintenancePageLoaderData
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
      <CataloguesTable catalogues={loaderData.catalogues} />
    </main>
  )
}
