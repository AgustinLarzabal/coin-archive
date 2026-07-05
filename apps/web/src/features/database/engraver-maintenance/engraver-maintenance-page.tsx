import { createServerFn } from "@tanstack/react-start"
import type { EngraverOption } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"

import { createEngraverAuthorizationError, hasEngraverMaintenanceAccess } from "./actions"
import { EngraversTable } from "./engravers-table"

type LoadEngraverMaintenancePageDataResult =
  | ReturnType<typeof createEngraverAuthorizationError>
  | {
      status: "success"
      engravers: EngraverOption[]
    }

type EngraverMaintenanceLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      engravers: EngraverOption[]
    }

type EngraverReadDependencies = {
  getEngravers: () => Promise<EngraverOption[]>
}

async function getDefaultEngraverReadDependencies(): Promise<EngraverReadDependencies> {
  const { getEngravers } = await import("@workspace/db")

  return {
    getEngravers,
  }
}

function toEngraverMaintenanceLoaderData(
  result: LoadEngraverMaintenancePageDataResult
): EngraverMaintenanceLoaderData {
  if (result.status === "error") {
    return { isAllowed: false }
  }

  return {
    isAllowed: true,
    engravers: result.engravers,
  }
}

export async function loadEngraverMaintenancePageData(
  collector: CollectorWithRole | null,
  dependencies?: EngraverReadDependencies
): Promise<LoadEngraverMaintenancePageDataResult> {
  if (!hasEngraverMaintenanceAccess(collector)) {
    return createEngraverAuthorizationError()
  }

  const { getEngravers } =
    dependencies ?? (await getDefaultEngraverReadDependencies())

  return {
    status: "success",
    engravers: await getEngravers(),
  }
}

const getEngraverMaintenanceLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadEngraverMaintenancePageData(session?.user ?? null)

  return toEngraverMaintenanceLoaderData(result)
})

export function loadEngraverMaintenanceRouteData() {
  return getEngraverMaintenanceLoaderData()
}

type EngraverMaintenanceRouteComponentProps = {
  loaderData: EngraverMaintenanceLoaderData
}

export function EngraverMaintenanceRouteComponent({
  loaderData,
}: EngraverMaintenanceRouteComponentProps) {
  return renderEngraverMaintenancePage(loaderData)
}

export function renderEngraverMaintenancePage(
  loaderData: EngraverMaintenanceLoaderData
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
      <EngraversTable engravers={loaderData.engravers} />
    </main>
  )
}
