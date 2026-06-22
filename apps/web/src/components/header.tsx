import { getSafeAuthRedirect } from "@/lib/auth-redirect"
import { Link, useRouterState } from "@tanstack/react-router"
import { authClient } from "@workspace/auth/client"
import { buttonVariants } from "@workspace/ui/components/button"
import { UserMenu } from "./user-menu"

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

export function Header() {
  const { data: session } = authClient.useSession()
  const loginRedirectTarget = useRouterState({
    select: (state) =>
      getLoginRedirectTarget({
        hash: state.location.hash,
        pathname: state.location.pathname,
        searchStr: state.location.searchStr,
      }),
  })
  const signInSearch =
    loginRedirectTarget === "/" ? {} : { redirect: loginRedirectTarget }

  return (
    <header className="z-10 flex h-[70px] items-center justify-end gap-4 border-b bg-background px-6">
      <div>
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
          <UserMenu />
        )}
      </div>
    </header>
  )
}
