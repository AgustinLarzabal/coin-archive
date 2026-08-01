import { AccessDenied } from "@/components/access-denied"

import type { DatabaseOverviewPageLoaderData } from "./database-overview-route-data"
import { DatabaseOverviewTable } from "./overview-table"

export {
  loadDatabaseOverviewPageData,
  loadDatabaseOverviewRouteData,
} from "./database-overview-route-data"

type DatabaseOverviewRouteComponentProps = {
  loaderData: DatabaseOverviewPageLoaderData
}

export function DatabaseOverviewRouteComponent({
  loaderData,
}: DatabaseOverviewRouteComponentProps) {
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
