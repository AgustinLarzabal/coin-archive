import { createServerFn } from "@tanstack/react-start"
import type { CompositionOption } from "@coin-archive/db"

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
import { hasCompositionMaintenanceAccess } from "./actions"
import { COMPOSITION_AUTHORIZATION_ERROR } from "./messages"
import { CompositionsTable } from "./table-workflow/compositions-table"

type LoadCompositionMaintenancePageDataResult = MaintenancePageLoadResult<
  {
    compositions: CompositionOption[]
  },
  {
    formError: typeof COMPOSITION_AUTHORIZATION_ERROR
  }
>

type CompositionMaintenancePageLoaderData = MaintenancePageLoaderData<{
  compositions: CompositionOption[]
}>

type CompositionMaintenanceReadDependencies = {
  getCompositions: () => Promise<CompositionOption[]>
}

async function getDefaultCompositionReadDependencies(): Promise<CompositionMaintenanceReadDependencies> {
  const { getCompositions } = await import("@coin-archive/db")

  return {
    getCompositions,
  }
}

export async function loadCompositionMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: CompositionMaintenanceReadDependencies
): Promise<LoadCompositionMaintenancePageDataResult> {
  if (!hasCompositionMaintenanceAccess(collector)) {
    return {
      status: "error",
      formError: COMPOSITION_AUTHORIZATION_ERROR,
    }
  }

  const { getCompositions } =
    dependencies ?? (await getDefaultCompositionReadDependencies())

  return {
    status: "success",
    compositions: await getCompositions(),
  }
}

const getCompositionMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadCompositionMaintenancePageData(session?.user ?? null)

  return toMaintenancePageLoaderData(result)
})

export function loadCompositionMaintenanceRouteData() {
  return getCompositionMaintenanceLoaderData()
}

type CompositionMaintenanceRouteComponentProps = {
  loaderData: CompositionMaintenancePageLoaderData
}

export function CompositionMaintenanceRouteComponent({
  loaderData,
}: CompositionMaintenanceRouteComponentProps) {
  return renderCompositionMaintenancePage(loaderData)
}

export function renderCompositionMaintenancePage(
  loaderData: CompositionMaintenancePageLoaderData
) {
  return renderMaintenancePage(loaderData, ({ compositions }) => (
    <main className="mt-8">
      <CompositionsTable compositions={compositions} />
    </main>
  ))
}
