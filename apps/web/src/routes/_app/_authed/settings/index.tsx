import { DeleteCollectorProfile } from "@/components/delete-collector-profile"

import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"

import { getAuthSession } from "@/lib/auth-session"
import { submitCollectorDeletion } from "@/lib/collector-deletion"

export const Route = createFileRoute("/_app/_authed/settings/")({
  component: SettingsIndexComponent,
})

const deleteCollectorProfile = createServerFn({
  method: "POST",
})
  .inputValidator((data: { confirmationPhrase: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitCollectorDeletion(session?.user ?? null, data)
  })

function SettingsIndexComponent() {
  const navigate = useNavigate()
  const deleteCurrentCollectorProfile = useServerFn(deleteCollectorProfile)

  return (
    <main className="mt-8">
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
  )
}
