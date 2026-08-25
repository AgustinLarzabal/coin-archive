import { Outlet, createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Header } from "@/components/header"
// import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"

const loadApiReferenceUrl = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getApiReferenceUrl } = await import("@/lib/public-api.server")
    return getApiReferenceUrl()
  }
)

export const Route = createFileRoute("/_app")({
  loader: () => loadApiReferenceUrl(),
  component: SharedShellRouteComponent,
})

function SharedShellRouteComponent() {
  const apiReferenceUrl = Route.useLoaderData()

  return (
    <div className="relative min-h-svh">
      {/* <Sidebar /> */}
      {/* <div className="flex min-h-svh grow flex-col md:ml-[70px]"> */}
      <div className="flex min-h-svh grow flex-col">
        <Header />
        <div className="flex grow flex-col">
          <Outlet />
        </div>
        <Footer apiReferenceUrl={apiReferenceUrl} />
      </div>
    </div>
  )
}
