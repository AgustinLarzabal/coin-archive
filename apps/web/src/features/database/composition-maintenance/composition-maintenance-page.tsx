import { createServerFn } from "@tanstack/react-start"
import type { CompositionOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createCompositionAuthorizationError, hasCompositionMaintenanceAccess } from "./actions"
import { CompositionsTable } from "./table-workflow/compositions-table"

type LoadCompositionMaintenancePageDataResult =
  | ReturnType<typeof createCompositionAuthorizationError>
  | {
      status: "success"
      compositions: CompositionOption[]
    }

type CompositionMaintenancePageLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      compositions: CompositionOption[]
    }

type CompositionMaintenanceReadDependencies = {
  getCompositions: () => Promise<CompositionOption[]>
}

async function getDefaultCompositionReadDependencies(): Promise<CompositionMaintenanceReadDependencies> {
  const { getCompositions } = await import("@workspace/db")

  return {
    getCompositions,
  }
}

function toCompositionMaintenancePageLoaderData(
  result: LoadCompositionMaintenancePageDataResult
): CompositionMaintenancePageLoaderData {
  if (result.status === "error") {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed: true,
    compositions: result.compositions,
  }
}

export async function loadCompositionMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: CompositionMaintenanceReadDependencies
): Promise<LoadCompositionMaintenancePageDataResult> {
  if (!hasCompositionMaintenanceAccess(collector)) {
    return createCompositionAuthorizationError()
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

  return toCompositionMaintenancePageLoaderData(result)
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
  if (!loaderData.isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <main className="mt-8">
      <CompositionsTable compositions={loaderData.compositions} />
    </main>
  )
}
