import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { getApiReferenceUrl } from "../lib/public-api.server"
import { Footer } from "./footer"

describe("Footer", () => {
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
})
