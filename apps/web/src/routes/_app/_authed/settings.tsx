import { DeleteCollectorProfile } from "@/components/delete-collector-profile"
import { SecondaryMenu } from "@/components/secondary-menu"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"

import { getAuthSession } from "@/lib/auth-session"

import { submitCollectorDeletion } from "./-collector-deletion-form"

export const Route = createFileRoute("/_app/_authed/settings")({
  component: SettingsComponent,
})

const deleteCollectorProfile = createServerFn({
  method: "POST",
})
  .inputValidator((data: { confirmationPhrase: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCollectorDeletion(session?.user ?? null, data)
  })

function SettingsComponent() {
  const navigate = useNavigate()
  const deleteCurrentCollectorProfile = useServerFn(deleteCollectorProfile)

  return (
    <div className="max-w-3xl">
      <SecondaryMenu items={[{ to: "/settings", label: "General" }]} />

      <main className="mt-8 space-y-12">
        <DeleteCollectorProfile
          onDeleteCollectorProfile={({ confirmationPhrase }) =>
            deleteCurrentCollectorProfile({
              data: {
                confirmationPhrase,
              },
            })
          }
          onDeleted={(redirectTo) => navigate({ to: redirectTo })}
        />
      </main>
    </div>
  )
}
