import { SiteHeader } from "@/components/site-header"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  getCatalogues,
  getCompositions,
  getCurrencies,
  getDistributions,
  getEdges,
  getEngravers,
  getIssuers,
  getMints,
  getOrientations,
  getRims,
  getRulers,
  getShapes,
  getTechniques,
  getThemes,
} from "@workspace/db"

import appCss from "@workspace/ui/globals.css?url"

const getCoinFilterOptions = createServerFn({ method: "GET" }).handler(
  async () => {
    const [
      catalogues,
      compositions,
      currencies,
      distributions,
      edges,
      engravers,
      issuers,
      mints,
      orientations,
      rims,
      rulers,
      shapes,
      techniques,
      themes,
    ] = await Promise.all([
      getCatalogues(),
      getCompositions(),
      getCurrencies(),
      getDistributions(),
      getEdges(),
      getEngravers(),
      getIssuers(),
      getMints(),
      getOrientations(),
      getRims(),
      getRulers(),
      getShapes(),
      getTechniques(),
      getThemes(),
    ])

    return {
      catalogues,
      compositions,
      currencies,
      distributions,
      edges,
      engravers,
      issuers,
      mints,
      orientations,
      rims,
      rulers,
      shapes,
      techniques,
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
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
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
