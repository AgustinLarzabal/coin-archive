import { createServerFn } from "@tanstack/react-start"
import type { DatabaseGeneralSummaryCounts } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

import { DatabaseOverviewTable } from "./database-overview-table"

type LoadDatabaseOverviewPageDataResult =
  | {
      status: "error"
    }
  | {
      status: "success"
      counts: DatabaseGeneralSummaryCounts
    }

type DatabaseOverviewPageLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      counts: DatabaseGeneralSummaryCounts
    }

type DatabaseOverviewReadDependencies = {
  getDatabaseGeneralSummaryCounts: () => Promise<DatabaseGeneralSummaryCounts>
}

async function getDefaultDatabaseOverviewReadDependencies(): Promise<DatabaseOverviewReadDependencies> {
  const { getDatabaseGeneralSummaryCounts } = await import("@workspace/db")

  return {
    getDatabaseGeneralSummaryCounts,
  }
}

function toDatabaseOverviewPageLoaderData(
  result: LoadDatabaseOverviewPageDataResult
): DatabaseOverviewPageLoaderData {
  if (result.status === "error") {
    return {
      isAllowed: false,
    }
  }

  return {
    isAllowed: true,
    counts: result.counts,
  }
}

export async function loadDatabaseOverviewPageData(
  collector: CollectorWithRole | null,
  dependencies?: DatabaseOverviewReadDependencies
): Promise<LoadDatabaseOverviewPageDataResult> {
  if (!getEditorRouteAuthorization(collector).isAllowed) {
    return {
      status: "error",
    }
  }

  const { getDatabaseGeneralSummaryCounts } =
    dependencies ?? (await getDefaultDatabaseOverviewReadDependencies())

  return {
    status: "success",
    counts: await getDatabaseGeneralSummaryCounts(),
  }
}

const getDatabaseOverviewLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadDatabaseOverviewPageData(session?.user ?? null)

  return toDatabaseOverviewPageLoaderData(result)
})

export function loadDatabaseOverviewRouteData() {
  return getDatabaseOverviewLoaderData()
}

type DatabaseOverviewRouteComponentProps = {
  loaderData: DatabaseOverviewPageLoaderData
}

export function DatabaseOverviewRouteComponent({
  loaderData,
}: DatabaseOverviewRouteComponentProps) {
  return renderDatabaseOverviewPage(loaderData)
}

export function renderDatabaseOverviewPage(
  loaderData: DatabaseOverviewPageLoaderData
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
      <DatabaseOverviewTable counts={loaderData.counts} />
    </main>
  )
}
