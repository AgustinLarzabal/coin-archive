import { Outlet, createFileRoute } from "@tanstack/react-router"
import { SecondaryMenu } from "@/components/secondary-menu"
import { databaseSecondaryMenuItems } from "@/features/database/navigation"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"
import { AccessDenied } from "@/components/access-denied"

export const Route = createFileRoute("/_app/_authed/database")({
  loader: async ({ context }) => {
    const authorization = getEditorRouteAuthorization(context.session.user)

    if (!authorization.isAllowed) {
      return authorization
    }

    return {
      ...authorization,
    }
  },
  component: DatabaseRouteComponent,
})

function DatabaseRouteComponent() {
  const { isAllowed } = Route.useLoaderData()

  if (!isAllowed) {
    return (
      <div className="grid items-center">
        <AccessDenied />
      </div>
    )
  }

  return (
    <div>
      <SecondaryMenu items={[...databaseSecondaryMenuItems]} />

      <div className="max-w-3xl">
        <Outlet />
      </div>
    </div>
  )
}
