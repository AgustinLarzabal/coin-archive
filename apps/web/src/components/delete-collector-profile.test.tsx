import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  DeleteCollectorProfile,
  isCollectorDeletionReady,
  requestCollectorDeletion,
} from "./delete-collector-profile"

function createDeletionRequestOptions() {
  const deletionRequest = {
    resolve:
      null as
        | ((value: { status: "success"; redirectTo: "/" }) => void)
        | null,
  }
  const onDeleteCollectorProfile = vi.fn(
    () =>
      new Promise<{ status: "success"; redirectTo: "/" }>((resolve) => {
        deletionRequest.resolve = resolve
      })
  )

  return {
    options: {
      confirmationPhrase: "DELETE" as const,
      submitLock: { current: false },
      onDeleteCollectorProfile,
      onDeleted: vi.fn(),
      setConfirmationError: vi.fn(),
      setFormError: vi.fn(),
      setIsOpen: vi.fn(),
      setIsPending: vi.fn(),
    },
    deletionRequest,
  }
}

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

  it("ignores repeated submit attempts while a Collector Deletion request is pending", async () => {
    const { options, deletionRequest } = createDeletionRequestOptions()

    const firstRequest = requestCollectorDeletion(options)
    const secondRequest = requestCollectorDeletion(options)

    expect(options.onDeleteCollectorProfile).toHaveBeenCalledTimes(1)
    expect(options.setIsPending).toHaveBeenCalledTimes(1)
    expect(options.setIsPending).toHaveBeenNthCalledWith(1, true)

    expect(deletionRequest.resolve).not.toBeNull()

    deletionRequest.resolve!({
      status: "success",
      redirectTo: "/",
    })

    await Promise.all([firstRequest, secondRequest])

    expect(options.onDeleted).toHaveBeenCalledWith("/")
    expect(options.setIsOpen).toHaveBeenCalledWith(false)
    expect(options.setIsPending).toHaveBeenLastCalledWith(false)
    expect(options.submitLock.current).toBe(false)
  })
})
