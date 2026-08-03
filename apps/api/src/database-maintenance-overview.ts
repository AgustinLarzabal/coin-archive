import type { DatabaseMaintenanceOverview } from "@coin-archive/api"
import type { Hono } from "hono"

import type { MaintenanceCollector } from "./orientation-maintenance"

export type DatabaseMaintenanceOverviewDependencies = {
  getDatabaseMaintenanceOverview: () => Promise<DatabaseMaintenanceOverview>
}

type Env = { Variables: { collector: MaintenanceCollector; requestId: string } }

export function registerDatabaseMaintenanceOverviewRoutes(
  app: Hono<Env>,
  dependencies: DatabaseMaintenanceOverviewDependencies
) {
  app.get("/api/v1/maintenance/overview", async (context) =>
    context.json({ data: await dependencies.getDatabaseMaintenanceOverview() })
  )
  app.all(
    "/api/v1/maintenance/overview",
    (context) =>
      new Response(
        JSON.stringify({
          type: "https://api.coinarchive.app/problems/method-not-allowed",
          title: "Method Not Allowed",
          status: 405,
          detail: "Only GET is supported",
          instance: context.req.path,
          code: "method_not_allowed",
        }),
        {
          status: 405,
          headers: {
            Allow: "GET",
            "Content-Type": "application/problem+json",
            "Cache-Control": "private, no-store",
          },
        }
      )
  )
}
