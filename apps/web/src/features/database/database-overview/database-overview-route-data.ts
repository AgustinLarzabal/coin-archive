import { createServerFn } from "@tanstack/react-start"
import type { DatabaseGeneralSummaryCounts } from "@coin-archive/db"

import { getAuthSession } from "@/lib/auth-session"
import type { CollectorWithRole } from "@/lib/collector-role"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"

export type DatabaseOverviewPageLoaderData =
  | {
      isAllowed: false
    }
  | {
      isAllowed: true
      counts: DatabaseGeneralSummaryCounts
    }

type DatabaseOverviewDependencies = {
  getDatabaseGeneralSummaryCounts: () => Promise<DatabaseGeneralSummaryCounts>
}

async function getDefaultDatabaseOverviewDependencies(): Promise<DatabaseOverviewDependencies> {
  const { getDatabaseGeneralSummaryCounts } = await import("@coin-archive/db")

  return {
    getDatabaseGeneralSummaryCounts,
  }
}

export async function loadDatabaseOverviewPageData(
  collector: CollectorWithRole | null,
  dependencies?: DatabaseOverviewDependencies
): Promise<DatabaseOverviewPageLoaderData> {
  if (!getEditorRouteAuthorization(collector).isAllowed) {
    return {
      isAllowed: false,
    }
  }

  const { getDatabaseGeneralSummaryCounts } =
    dependencies ?? (await getDefaultDatabaseOverviewDependencies())

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
