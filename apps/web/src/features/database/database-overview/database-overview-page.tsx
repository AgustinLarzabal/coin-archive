import { createServerFn } from "@tanstack/react-start"
import type { DatabaseGeneralSummaryCounts } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

import { DatabaseOverviewTable } from "./database-overview-table"

type DatabaseOverviewPageData =
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

export async function loadDatabaseOverviewPageData(
  collector: CollectorWithRole | null,
  dependencies?: DatabaseOverviewReadDependencies
): Promise<DatabaseOverviewPageData> {
  if (!getEditorRouteAuthorization(collector).isAllowed) {
    return {
      isAllowed: false,
    }
  }

  const { getDatabaseGeneralSummaryCounts } =
    dependencies ?? (await getDefaultDatabaseOverviewReadDependencies())

  return {
    isAllowed: true,
    counts: await getDatabaseGeneralSummaryCounts(),
  }
}

const getDatabaseOverviewLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  return loadDatabaseOverviewPageData(session?.user ?? null)
})

export function loadDatabaseOverviewRouteData() {
  return getDatabaseOverviewLoaderData()
}

type DatabaseOverviewRouteComponentProps = {
  loaderData: DatabaseOverviewPageData
}

export function DatabaseOverviewRouteComponent({
  loaderData,
}: DatabaseOverviewRouteComponentProps) {
  return renderDatabaseOverviewPage(loaderData)
}

export function renderDatabaseOverviewPage(
  loaderData: DatabaseOverviewPageData
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
