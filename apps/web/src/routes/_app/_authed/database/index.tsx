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

      <main className="mt-8 space-y-4"></main>
    </div>
  )
}
