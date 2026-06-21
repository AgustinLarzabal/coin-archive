import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import {
  getAuthenticatedLoginRedirect,
  getSafeAuthRedirect,
} from "../lib/auth-redirect"
import { startGoogleSignIn } from "../lib/google-sign-in"

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
  const [{ auth }, { getRequestHeaders }] = await Promise.all([
    import("@workspace/auth/server"),
    import("@tanstack/react-start/server"),
  ])

  return auth.api.getSession({
    headers: getRequestHeaders(),
  })
})

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ search }) => {
    const session = await getAuthSession()
    const redirectTarget = getAuthenticatedLoginRedirect(
      session !== null,
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
  const redirectTarget = getSafeAuthRedirect(search.redirect)

  return <LoginPage redirectTarget={redirectTarget} />
}

export function LoginPage({ redirectTarget }: { redirectTarget: string }) {
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
          onClick={() => {
            void startGoogleSignIn(redirectTarget)
          }}
        >
          Continue with Google
        </button>
      </section>
    </main>
  )
}
