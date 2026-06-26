import { Outlet, createFileRoute } from "@tanstack/react-router"
import { SecondaryMenu } from "@/components/secondary-menu"
import { getEditorRouteAuthorization } from "@/lib/route-authorization"
import { AccessDenied } from "@/components/access-denied"

export const databaseSecondaryMenuItems = [
  { to: "/database", label: "General" },
  { to: "/database/catalogues", label: "Catalogues" },
  { to: "/database/compositions", label: "Compositions" },
] as const

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
    <div className="max-w-3xl">
      <SecondaryMenu items={[...databaseSecondaryMenuItems]} />

      <Outlet />
    </div>
  )
}
