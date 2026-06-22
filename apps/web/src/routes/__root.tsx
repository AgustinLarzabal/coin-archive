import { NotFound } from "@/components/not-found"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  getDistributions,
  getEngravers,
  getIssuers,
  getRulers,
  getThemes,
} from "@workspace/db"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import appCss from "@workspace/ui/globals.css?url"

const getCoinFilterOptions = createServerFn({ method: "GET" }).handler(
  async () => {
    const [distributions, engravers, issuers, rulers, themes] =
      await Promise.all([
        getDistributions(),
        getEngravers(),
        getIssuers(),
        getRulers(),
        getThemes(),
      ])

    return {
      distributions,
      engravers,
      issuers,
      rulers,
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
    <html lang="en" className="dark antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="relative">
        <TooltipProvider>{children}</TooltipProvider>
        <Scripts />
      </body>
    </html>
  )
}
