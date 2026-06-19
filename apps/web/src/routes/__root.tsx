import { NotFound } from "@/components/not-found"
import { SiteHeader } from "@/components/site-header"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  getDistributions,
  getEngravers,
  getIssuers,
  getThemes,
} from "@workspace/db"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import appCss from "@workspace/ui/globals.css?url"

const getCoinFilterOptions = createServerFn({ method: "GET" }).handler(
  async () => {
    const [distributions, engravers, issuers, themes] = await Promise.all([
      getDistributions(),
      getEngravers(),
      getIssuers(),
      getThemes(),
    ])

    return {
      distributions,
      engravers,
      issuers,
      themes,
    }
  }
)

export const Route = createRootRoute({
  loader: () => getCoinFilterOptions(),
  staleTime: Infinity,
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
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark font-mono antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="relative flex min-h-svh flex-col">
        <TooltipProvider>
          <SiteHeader />
          {children}
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  )
}
