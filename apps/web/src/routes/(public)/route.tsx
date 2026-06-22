import { Outlet, createFileRoute } from "@tanstack/react-router"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"

export const Route = createFileRoute("/(public)")({
  component: PublicRouteComponent,
})

function PublicRouteComponent() {
  return (
    <div className="flex min-h-svh flex-col">
      <Sidebar />
      <div className="flex flex-1 flex-col md:ml-[70px]">
        <Header />
        <div className="flex-1 p-6">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  )
}
