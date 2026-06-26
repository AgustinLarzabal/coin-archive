import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { DatabaseGeneralSummaryCounts } from "@workspace/db"

import { AccessDenied } from "@/components/access-denied"
import { DatabaseGeneralSummaryTable } from "@/components/tables/database-general-summary-table"
import { getAuthSession } from "@/lib/auth-session"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"
import type { CollectorWithRole } from "@/lib/collector-role"

type LoadDatabaseGeneralSummaryCountsResult =
  | {
      status: "error"
    }
  | {
      status: "success"
      counts: DatabaseGeneralSummaryCounts
    }

type DatabaseGeneralLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      counts: DatabaseGeneralSummaryCounts
    }

type DatabaseGeneralReadDependencies = {
  getDatabaseGeneralSummaryCounts: () => Promise<DatabaseGeneralSummaryCounts>
}

async function getDefaultDatabaseGeneralReadDependencies(): Promise<DatabaseGeneralReadDependencies> {
  const { getDatabaseGeneralSummaryCounts } = await import("@workspace/db")

  return {
    getDatabaseGeneralSummaryCounts,
  }
}

export async function loadDatabaseGeneralSummaryCounts(
  collector: CollectorWithRole | null,
  dependencies?: DatabaseGeneralReadDependencies
): Promise<LoadDatabaseGeneralSummaryCountsResult> {
  const authorization = getEditorRouteAuthorization(collector)

  if (!authorization.isAllowed) {
    return {
      status: "error",
    }
  }

  const { getDatabaseGeneralSummaryCounts } =
    dependencies ?? (await getDefaultDatabaseGeneralReadDependencies())

  return {
    status: "success",
    counts: await getDatabaseGeneralSummaryCounts(),
  }
}

const getDatabaseGeneralLoaderData = createServerFn({
  method: "GET",
}).handler(async () => {
  const session = await getAuthSession()
  const result = await loadDatabaseGeneralSummaryCounts(session?.user ?? null)

  if (result.status === "error") {
    return {
      isAllowed: false,
    } satisfies DatabaseGeneralLoaderData
  }

  return {
    isAllowed: true,
    counts: result.counts,
  } satisfies DatabaseGeneralLoaderData
})

export const Route = createFileRoute("/_app/_authed/database/")({
  loader: () => getDatabaseGeneralLoaderData(),
  component: DatabaseIndexComponent,
})

function DatabaseIndexComponent() {
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
      <DatabaseGeneralSummaryTable counts={loaderData.counts} />
    </main>
  )
}
