import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"

import {
  getAuthenticatedLoginRedirect,
  getSafeAuthRedirect,
} from "../../lib/auth-redirect"
import { getAuthSession } from "../../lib/auth-session"
import { startGoogleSignIn } from "../../lib/google-sign-in"

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

type LoginSearch = z.infer<typeof loginSearchSchema>
type LoginPageProps = {
  redirectTarget: string
}

function getLoginRedirectTarget(search: LoginSearch) {
  return getSafeAuthRedirect(search.redirect)
}

export const Route = createFileRoute("/(public)/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ search }) => {
    const session = await getAuthSession()
    const isSignedIn = session !== null
    const redirectTarget = getAuthenticatedLoginRedirect(
      isSignedIn,
      search.redirect
    )

    if (redirectTarget !== null) {
      throw redirect({
        to: redirectTarget,
      })
    }
  },
  component: LoginRoute,
})

function LoginRoute() {
  const search = Route.useSearch()
  const redirectTarget = getLoginRedirectTarget(search)

  return <LoginPage redirectTarget={redirectTarget} />
}

export function LoginPage({ redirectTarget }: LoginPageProps) {
  function handleGoogleSignIn() {
    void startGoogleSignIn(redirectTarget)
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with Google to continue as a Collector.
          </p>
        </div>
        <button
          className="mt-6 w-full rounded-md border px-4 py-3 text-sm font-medium"
          type="button"
          onClick={handleGoogleSignIn}
        >
          Continue with Google
        </button>
      </section>
    </main>
  )
}
