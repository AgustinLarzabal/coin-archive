import { Outlet, createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const Route = createFileRoute("/_app")({
  component: SharedShellRouteComponent,
})

function SharedShellRouteComponent() {
  return (
    <div className="relative min-h-svh">
      <div className="flex min-h-svh grow flex-col">
        <Header />
        <div className="flex grow flex-col">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  )
}
