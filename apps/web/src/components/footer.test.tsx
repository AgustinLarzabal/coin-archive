import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getApiReferenceUrl } from "../lib/public-api.server"
import { Footer } from "./footer"

const authState = vi.hoisted(() => ({
  session: null as { user: { role?: string | null } } | null,
}))

vi.mock("@coin-archive/auth/client", () => ({
  authClient: {
    useSession: () => ({ data: authState.session }),
  },
  hasEditorAccess: (role: string) => role === "editor" || role === "admin",
  isCollectorRole: (role: string) =>
    role === "collector" || role === "editor" || role === "admin",
}))

describe("Footer", () => {
  afterEach(() => {
    authState.session = null
  })

  it.each([
    [undefined, "http://127.0.0.1:8787/api/v1/reference"],
    ["staging", "https://api.staging.coinarchive.app/api/v1/reference"],
    ["production", "https://api.coinarchive.app/api/v1/reference"],
  ])(
    "links to the %s API Reference while preserving GitHub",
    (environment, expectedUrl) => {
      const markup = renderToStaticMarkup(
        <Footer
          apiReferenceUrl={getApiReferenceUrl({
            CLOUDFLARE_ENV: environment,
          })}
        />
      )

      expect(markup).toContain(`href="${expectedUrl}"`)
      expect(markup).toContain("API Reference")
      expect(markup).toContain(
        'href="https://github.com/AgustinLarzabal/coin-archive"'
      )
      expect(markup).toContain("GitHub")
    }
  )

  it("shows Database only to signed-in Editors and Admins", () => {
    expect(renderToStaticMarkup(<Footer apiReferenceUrl="" />)).not.toContain(
      "Database"
    )

    authState.session = { user: { role: "collector" } }
    expect(renderToStaticMarkup(<Footer apiReferenceUrl="" />)).not.toContain(
      "Database"
    )

    authState.session = { user: { role: "editor" } }
    const editorMarkup = renderToStaticMarkup(<Footer apiReferenceUrl="" />)
    expect(editorMarkup).toContain(
      "Database"
    )
    expect(editorMarkup).toContain('href="/database"')
    expect(editorMarkup).not.toContain('href="/database" target="_blank"')

    authState.session = { user: { role: "admin" } }
    expect(renderToStaticMarkup(<Footer apiReferenceUrl="" />)).toContain(
      "Database"
    )
  })
})
