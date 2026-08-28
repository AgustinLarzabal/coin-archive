import { renderMaintenancePage } from "../maintenance-page"
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
  return renderMaintenancePage(loaderData, ({ counts }) => (
    <main className="mt-8">
      <DatabaseOverviewTable counts={counts} />
    </main>
  ))
}
