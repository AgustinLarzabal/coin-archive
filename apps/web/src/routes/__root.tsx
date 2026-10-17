import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useMatchRoute,
} from "@tanstack/react-router"
import appCss from "@workspace/ui/globals.css?url"
import { cn } from "@workspace/ui/lib/utils"
import { lazy, Suspense } from "react"

import type { RouterContext } from "@/router"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { NotFound } from "@/components/not-found"

const DevelopmentTools = import.meta.env.DEV
  ? lazy(() => import("@/components/development-tools"))
  : null

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Coin Archive",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const matchRoute = useMatchRoute()
  const isCoinDetailsPage = Boolean(matchRoute({ to: "/coins/$coinId" }))

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body
        className={cn(
          "flex min-h-svh flex-col font-sans antialiased",
          isCoinDetailsPage && "overflow-hidden"
        )}
      >
        {!isCoinDetailsPage && <Header />}
        {children}
        <Footer />
        {DevelopmentTools && (
          <Suspense fallback={null}>
            <DevelopmentTools />
          </Suspense>
        )}
        <Scripts />
      </body>
    </html>
  )
}
