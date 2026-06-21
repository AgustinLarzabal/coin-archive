import { Link, useRouterState } from "@tanstack/react-router"
import { authClient } from "@workspace/auth/client"
import { buttonVariants } from "@workspace/ui/components/button"
import { getSafeAuthRedirect } from "../lib/auth-redirect"
import { GitHubLink } from "./github-link"

type CollectorSession = typeof authClient.$Infer.Session
type SiteHeaderContentProps = {
  loginRedirectTarget: string
  onSignOut?: () => Promise<void> | void
  session: CollectorSession | null
}

export function getCollectorIdentityLabel({
  email,
  name,
}: {
  email: string
  name?: string | null
}) {
  const trimmedName = name?.trim()

  return trimmedName ? trimmedName : email
}

export function getLoginRedirectTarget({
  hash,
  pathname,
  searchStr,
}: {
  hash: string
  pathname: string
  searchStr: string
}) {
  const redirectTarget = `${pathname}${searchStr}${hash}`

  return getSafeAuthRedirect(redirectTarget)
}

export function SiteHeader() {
  const { data: session } = authClient.useSession()
  const loginRedirectTarget = useRouterState({
    select: (state) =>
      getLoginRedirectTarget({
        hash: state.location.hash,
        pathname: state.location.pathname,
        searchStr: state.location.searchStr,
      }),
  })

  async function handleSignOut() {
    await authClient.signOut()
  }

  return (
    <SiteHeaderContent
      loginRedirectTarget={loginRedirectTarget}
      onSignOut={handleSignOut}
      session={session}
    />
  )
}

export function SiteHeaderContent({
  loginRedirectTarget,
  onSignOut,
  session,
}: SiteHeaderContentProps) {
  const signInSearch =
    loginRedirectTarget === "/" ? {} : { redirect: loginRedirectTarget }
  const collectorLabel =
    session === null ? null : getCollectorIdentityLabel(session.user)

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <Link
          to="/"
          className="text-sm tracking-wider text-muted-foreground uppercase"
        >
          Coin Archive
        </Link>
        <div className="flex items-center gap-2">
          {session === null ? (
            <Link
              to="/login"
              search={signInSearch}
              className={buttonVariants({
                size: "sm",
                variant: "outline",
              })}
            >
              Sign in
            </Link>
          ) : (
            <>
              <p className="text-right text-xs leading-tight text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {collectorLabel}
                </span>
              </p>
              <button
                type="button"
                className={buttonVariants({
                  size: "sm",
                  variant: "ghost",
                })}
                onClick={() => {
                  void onSignOut?.()
                }}
              >
                Sign out
              </button>
            </>
          )}
          <GitHubLink />
        </div>
      </div>
    </header>
  )
}
