import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  DeleteCollectorProfile,
  isCollectorDeletionReady,
} from "./delete-collector-profile"

describe("DeleteCollectorProfile", () => {
  it("renders Collector Deletion language and keeps the destructive action disabled until DELETE is entered", () => {
    const markup = renderToStaticMarkup(
      <DeleteCollectorProfile
        onDeleteCollectorProfile={vi.fn()}
        onDeleted={vi.fn()}
      />
    )

    expect(markup).toContain("Delete Collector profile")
    expect(markup).toContain("Collector Deletion is immediate, irreversible")
    expect(markup).toContain("does not delete catalogue data")
    expect(markup).toContain("Delete Collector profile</button>")
  })

  it("enables the destructive action only for the exact confirmation phrase while not pending", () => {
    expect(isCollectorDeletionReady("", false)).toBe(false)
    expect(isCollectorDeletionReady("delete", false)).toBe(false)
    expect(isCollectorDeletionReady("DELETE", true)).toBe(false)
    expect(isCollectorDeletionReady("DELETE", false)).toBe(true)
  })
})
