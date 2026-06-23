import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  DeleteCollectorProfile,
  isCollectorDeletionReady,
  requestCollectorDeletion,
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

  it("ignores repeated submit attempts while a Collector Deletion request is pending", async () => {
    let resolveDeletion:
      | ((value: { status: "success"; redirectTo: "/" }) => void)
      | null = null
    const onDeleteCollectorProfile = vi.fn(
      () =>
        new Promise<{ status: "success"; redirectTo: "/" }>((resolve) => {
          resolveDeletion = resolve
        })
    )
    const onDeleted = vi.fn()
    const setConfirmationError = vi.fn()
    const setFormError = vi.fn()
    const setIsOpen = vi.fn()
    const setIsPending = vi.fn()
    const isSubmittingRef = {
      current: false,
    }

    const firstRequest = requestCollectorDeletion({
      confirmationPhrase: "DELETE",
      isSubmittingRef,
      onDeleteCollectorProfile,
      onDeleted,
      setConfirmationError,
      setFormError,
      setIsOpen,
      setIsPending,
    })

    const secondRequest = requestCollectorDeletion({
      confirmationPhrase: "DELETE",
      isSubmittingRef,
      onDeleteCollectorProfile,
      onDeleted,
      setConfirmationError,
      setFormError,
      setIsOpen,
      setIsPending,
    })

    expect(onDeleteCollectorProfile).toHaveBeenCalledTimes(1)
    expect(setIsPending).toHaveBeenCalledTimes(1)
    expect(setIsPending).toHaveBeenNthCalledWith(1, true)

    expect(resolveDeletion).not.toBeNull()

    resolveDeletion!({
      status: "success",
      redirectTo: "/",
    })

    await Promise.all([firstRequest, secondRequest])

    expect(onDeleted).toHaveBeenCalledWith("/")
    expect(setIsOpen).toHaveBeenCalledWith(false)
    expect(setIsPending).toHaveBeenLastCalledWith(false)
    expect(isSubmittingRef.current).toBe(false)
  })
})
