import { createFileRoute } from "@tanstack/react-router"

import { SecondaryMenu } from "@/components/secondary-menu"
import { databaseSecondaryMenuItems } from "./-database-page"

export const Route = createFileRoute("/_app/_authed/database/")({
  component: DatabaseIndexComponent,
})

function DatabaseIndexComponent() {
  return (
    <div className="max-w-3xl">
      <SecondaryMenu items={[...databaseSecondaryMenuItems]} />

      <main className="mt-8 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Database</h2>
          <p className="text-sm text-muted-foreground">
            Maintain shared Coin Archive reference data used across the public
            catalogue.
          </p>
        </div>
      </main>
    </div>
  )
}
