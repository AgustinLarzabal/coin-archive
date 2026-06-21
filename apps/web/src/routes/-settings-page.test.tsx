import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SettingsPage } from "./_authed.settings"

describe("SettingsPage", () => {
  it("renders the Settings placeholder in the shared private-page presentation", () => {
    const markup = renderToStaticMarkup(<SettingsPage />)

    expect(markup).toContain("Settings")
    expect(markup).toContain(
      "Manage Collector-specific settings and preferences here as the private app grows."
    )
    expect(markup).toContain("Collector settings will appear here later.")
  })
})
