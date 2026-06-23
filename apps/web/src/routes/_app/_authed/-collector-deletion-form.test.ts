import { describe, expect, it, vi } from "vitest"

import {
  COLLECTOR_DELETION_CONFIRMATION_ERROR,
  COLLECTOR_DELETION_GENERIC_ERROR,
  COLLECTOR_DELETION_UNAUTHENTICATED_ERROR,
  submitCollectorDeletion,
} from "./-collector-deletion-form"

function createDependencies(overrides?: {
  deleteCollectorIdentity?: ReturnType<typeof vi.fn>
}) {
  return {
    deleteCollectorIdentity: vi.fn(),
    ...overrides,
  }
}

describe("submitCollectorDeletion", () => {
  const currentCollector = {
    id: "collector-1",
  }

  it("returns an inline authentication error for signed-out deletion attempts", async () => {
    await expect(
      submitCollectorDeletion(null, { confirmationPhrase: "DELETE" })
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COLLECTOR_DELETION_UNAUTHENTICATED_ERROR,
    })
  })

  it("requires the exact DELETE confirmation phrase", async () => {
    const dependencies = createDependencies()

    await expect(
      submitCollectorDeletion(
        currentCollector,
        { confirmationPhrase: "delete" },
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {
        confirmationPhrase: COLLECTOR_DELETION_CONFIRMATION_ERROR,
      },
    })

    expect(dependencies.deleteCollectorIdentity).not.toHaveBeenCalled()
  })

  it("deletes the current Collector derived from the request session", async () => {
    const dependencies = createDependencies({
      deleteCollectorIdentity: vi.fn().mockResolvedValue({
        id: "collector-1",
      }),
    })
    const forgedInput = {
      confirmationPhrase: "DELETE",
      collectorId: "collector-2",
    }

    await expect(
      submitCollectorDeletion(
        currentCollector,
        forgedInput,
        dependencies
      )
    ).resolves.toStrictEqual({
      status: "success",
      redirectTo: "/",
    })

    expect(dependencies.deleteCollectorIdentity).toHaveBeenCalledWith(
      "collector-1"
    )
  })

  it("returns a generic form error for unexpected persistence failures", async () => {
    await expect(
      submitCollectorDeletion(
        currentCollector,
        { confirmationPhrase: "DELETE" },
        createDependencies({
          deleteCollectorIdentity: vi.fn().mockRejectedValue(new Error("boom")),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COLLECTOR_DELETION_GENERIC_ERROR,
    })
  })

  it("returns an inline authentication error when the current Collector row is already gone", async () => {
    await expect(
      submitCollectorDeletion(
        currentCollector,
        { confirmationPhrase: "DELETE" },
        createDependencies({
          deleteCollectorIdentity: vi.fn().mockResolvedValue(null),
        })
      )
    ).resolves.toStrictEqual({
      status: "error",
      fieldErrors: {},
      formError: COLLECTOR_DELETION_UNAUTHENTICATED_ERROR,
    })
  })
})
