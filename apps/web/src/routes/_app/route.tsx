import { Outlet, createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"

export const Route = createFileRoute("/_app")({
  component: SharedShellRouteComponent,
})

function SharedShellRouteComponent() {
  return (
    <div className="relative min-h-svh">
      <Sidebar />
      <div className="flex min-h-svh flex-1 flex-col md:ml-[70px]">
        <Header />
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  )
}
