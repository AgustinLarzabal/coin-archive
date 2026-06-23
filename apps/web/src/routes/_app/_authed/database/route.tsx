import { Outlet, createFileRoute } from "@tanstack/react-router"
import { SecondaryMenu } from "@/components/secondary-menu"
import { databaseSecondaryMenuItems } from "./-database-page"

export const Route = createFileRoute("/_app/_authed/database")({
  component: DatabaseRouteComponent,
})

function DatabaseRouteComponent() {
  return (
    <div className="max-w-3xl">
      <SecondaryMenu items={[...databaseSecondaryMenuItems]} />

      <Outlet />
    </div>
  )
}
