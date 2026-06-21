import type { ReactNode } from "react"

type AuthedRouteLayoutProps = {
  children: ReactNode
}

export function AuthedRouteLayout({ children }: AuthedRouteLayoutProps) {
  return (
    <main className="flex flex-1 justify-center p-6">
      <div className="w-full max-w-3xl">{children}</div>
    </main>
  )
}
