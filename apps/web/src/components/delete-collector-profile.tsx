import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useEffect, useState } from "react"

import type { CollectorDeletionResult } from "../routes/_app/_authed/-collector-deletion-form"

type DeleteCollectorProfileProps = {
  onDeleteCollectorProfile: (input: {
    confirmationPhrase: string
  }) => Promise<CollectorDeletionResult>
  onDeleted: (redirectTo: "/") => void | Promise<void>
}

export function isCollectorDeletionReady(
  confirmationPhrase: string,
  isPending: boolean
): boolean {
  return confirmationPhrase === "DELETE" && !isPending
}

export function DeleteCollectorProfile({
  onDeleteCollectorProfile,
  onDeleted,
}: DeleteCollectorProfileProps) {
  const [confirmationPhrase, setConfirmationPhrase] = useState("")
  const [confirmationError, setConfirmationError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  function resetDialogState() {
    setConfirmationPhrase("")
    setConfirmationError(null)
    setFormError(null)
    setIsPending(false)
  }

  useEffect(() => {
    if (isOpen) {
      return
    }

    resetDialogState()
  }, [isOpen])

  async function handleDeleteCollectorProfile() {
    setConfirmationError(null)
    setFormError(null)
    setIsPending(true)

    try {
      const result = await onDeleteCollectorProfile({
        confirmationPhrase,
      })

      if (result.status === "success") {
        setIsOpen(false)
        await onDeleted(result.redirectTo)
        return
      }

      setConfirmationError(result.fieldErrors.confirmationPhrase ?? null)
      setFormError(result.formError ?? null)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="border border-destructive">
      <CardHeader>
        <CardTitle>Delete Collector profile</CardTitle>
        <CardDescription>
          Permanently remove your Collector sign-in identity. Collector
          Deletion is immediate, irreversible, removes linked sign-in sessions,
          and does not delete catalogue data.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end">
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Delete Collector profile
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Collector profile</AlertDialogTitle>
              <AlertDialogDescription>
                This immediately and permanently deletes your Collector
                sign-in identity, linked OAuth account records, and sessions.
                Catalogue data remains in Coin Archive.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-2 flex flex-col gap-2">
              <Label htmlFor="confirm-collector-deletion">
                Type <span className="font-medium">DELETE</span> to confirm
                Collector Deletion.
              </Label>
              <Input
                id="confirm-collector-deletion"
                name="confirmationPhrase"
                value={confirmationPhrase}
                onChange={(event) => setConfirmationPhrase(event.target.value)}
              />
              {confirmationError ? (
                <p className="text-sm text-destructive">{confirmationError}</p>
              ) : null}
              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel variant="outline" disabled={isPending}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeleteCollectorProfile}
                disabled={
                  !isCollectorDeletionReady(confirmationPhrase, isPending)
                }
              >
                Delete Collector profile
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
