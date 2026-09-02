import { renderMaintenancePage } from "../maintenance-page"
import type { DatabaseOverviewPageLoaderData } from "./database-overview-loaders.server"
import { DatabaseOverviewTable } from "./overview-table"

export { loadDatabaseOverviewRouteData } from "./database-overview-route-loaders"

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
