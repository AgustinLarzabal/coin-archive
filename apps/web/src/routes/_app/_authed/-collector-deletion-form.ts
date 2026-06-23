import { z } from "zod"

export const COLLECTOR_DELETION_UNAUTHENTICATED_ERROR =
  "You must be signed in to delete your Collector profile."
export const COLLECTOR_DELETION_CONFIRMATION_ERROR =
  "Type DELETE exactly to confirm Collector Deletion."
export const COLLECTOR_DELETION_GENERIC_ERROR =
  "Unable to delete your Collector profile right now."

const collectorDeletionInputSchema = z.object({
  confirmationPhrase: z.string().refine((value) => value === "DELETE", {
    message: COLLECTOR_DELETION_CONFIRMATION_ERROR,
  }),
})

export type CollectorDeletionFieldErrors = Partial<{
  confirmationPhrase: string
}>

export type CollectorDeletionResult =
  | {
      status: "error"
      fieldErrors: CollectorDeletionFieldErrors
      formError?: string
    }
  | {
      status: "success"
      redirectTo: "/"
    }

type CollectorDeletionInput = z.input<typeof collectorDeletionInputSchema>

type CollectorDeletionDependencies = {
  deleteCollectorIdentity: (collectorId: string) => Promise<unknown | null>
}

type CollectorIdentity = {
  id?: string | null
  role?: string | null
}

async function getDefaultCollectorDeletionDependencies(): Promise<CollectorDeletionDependencies> {
  const { deleteCollectorIdentity } = await import("@workspace/db")

  return {
    deleteCollectorIdentity: async (collectorId) =>
      deleteCollectorIdentity({ collectorId }),
  }
}

function createFormErrorResult(formError: string): CollectorDeletionResult {
  return {
    status: "error",
    fieldErrors: {},
    formError,
  }
}

function createFieldErrorResult(
  fieldErrors: CollectorDeletionFieldErrors
): CollectorDeletionResult {
  return {
    status: "error",
    fieldErrors,
  }
}

export async function submitCollectorDeletion(
  collector: CollectorIdentity | null,
  input: CollectorDeletionInput,
  dependencies?: CollectorDeletionDependencies
): Promise<CollectorDeletionResult> {
  if (!collector?.id) {
    return createFormErrorResult(COLLECTOR_DELETION_UNAUTHENTICATED_ERROR)
  }

  const parsedInput = collectorDeletionInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return createFieldErrorResult({
      confirmationPhrase:
        parsedInput.error.issues.at(0)?.message ??
        COLLECTOR_DELETION_CONFIRMATION_ERROR,
    })
  }

  const resolvedDependencies =
    dependencies ?? (await getDefaultCollectorDeletionDependencies())

  try {
    const deletedCollector = await resolvedDependencies.deleteCollectorIdentity(
      collector.id
    )

    if (deletedCollector === null) {
      return createFormErrorResult(COLLECTOR_DELETION_UNAUTHENTICATED_ERROR)
    }

    return {
      status: "success",
      redirectTo: "/",
    }
  } catch {
    return createFormErrorResult(COLLECTOR_DELETION_GENERIC_ERROR)
  }
}
