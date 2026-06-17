import { NotFound } from "@/components/not-found"
import { SiteHeader } from "@/components/site-header"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getIssuers } from "@workspace/db"

import appCss from "@workspace/ui/globals.css?url"

const getCoinFilterOptions = createServerFn({ method: "GET" }).handler(
  async () => {
    const [issuers] = await Promise.all([getIssuers()])

    return {
      issuers,
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
    <html lang="en" className="dark font-mono">
      <head>
        <HeadContent />
      </head>
      <body className="relative flex min-h-svh flex-col">
        <SiteHeader />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
