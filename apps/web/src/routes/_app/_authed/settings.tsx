import { DeleteAccount } from "@/components/delete-account"
import { SecondaryMenu } from "@/components/secondary-menu"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/_authed/settings")({
  component: SettingsComponent,
})

function SettingsComponent() {
  return (
    <div className="max-w-3xl">
      <SecondaryMenu items={[{ to: "/settings", label: "General" }]} />

      <main className="mt-8 space-y-12">
        <DeleteAccount />
      </main>
    </div>
  )
}
