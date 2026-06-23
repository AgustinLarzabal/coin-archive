import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"

import {
  getAuthenticatedLoginRedirect,
  getSafeAuthRedirect,
} from "../../../lib/auth-redirect"
import { OAuthSignIn } from "../../../components/o-auth-signin"
import { getEnabledProviders } from "../../../lib/enabled-providers"
import { getAuthSession } from "../../../lib/auth-session"
import { authClient } from "@workspace/auth/client"

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

export const Route = createFileRoute("/_app/(public)/login")({
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
  const callbackURL = getSafeAuthRedirect(redirectTarget)
  const enabledProviders = getEnabledProviders()

  return (
    <div className="flex grow items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="font-serif text-lg">Welcome to Coin Archive</h1>
          <p className="font-sans text-sm text-muted-foreground">
            Sign in or create an account
          </p>
        </div>

        {enabledProviders.length > 0 && (
          <>
            <div>
              <OAuthSignIn
                providers={enabledProviders}
                onProviderClick={(provider) =>
                  authClient.signIn.social({ provider, callbackURL })
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
