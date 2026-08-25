import {
  getLocationRedirectTarget,
  getSafeAuthRedirect,
} from "@/lib/auth-redirect"
import { getCollectorRole } from "@/lib/collector-role"
import { getProductFlags } from "@/lib/product-flags"
import { Link, useRouterState } from "@tanstack/react-router"
import { authClient, hasEditorAccess } from "@coin-archive/auth/client"
import { buttonVariants } from "@coin-archive/ui/components/button"
import { UserMenu } from "./user-menu"
import { Icons } from "./icons"

export function getLoginRedirectTarget({
  hash,
  pathname,
  searchStr,
}: {
  hash: string
  pathname: string
  searchStr: string
}) {
  const redirectTarget = getLocationRedirectTarget({
    hash,
    pathname,
    searchStr,
  })

  return getSafeAuthRedirect(redirectTarget)
}

export function Header() {
  const { data: session } = authClient.useSession()
  const { showSignInButton } = getProductFlags()
  const role = getCollectorRole(session?.user ?? null)
  const canAccessDatabase = role !== null && hasEditorAccess(role)
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
    <header className="z-10 flex h-[70px] items-center justify-between gap-4 border-b bg-background px-6">
      <div>
        {canAccessDatabase && (
          <Link
            to="/database"
            className={buttonVariants({
              size: "sm",
              variant: "ghost",
            })}
          >
            <Icons.Database size={20} /> Database
          </Link>
        )}
      </div>
      <div>
        {session === null ? (
          showSignInButton && (
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
          )
        ) : (
          <UserMenu />
        )}
      </div>
    </header>
  )
}
