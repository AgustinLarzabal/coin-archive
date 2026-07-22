import { useState } from "react"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CoinMaintenanceDeleteSummary } from "@workspace/db"
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
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { getAuthSession } from "@/lib/auth-session"

import {
  submitDeleteCoin,
  type CoinDeleteMutationResult,
} from "../actions"

const deleteCoinAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { confirmationTitle: string; id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteCoin(session?.user ?? null, data)
  })

type DeleteCoinProps = {
  coinId: string
  deleteSummary: CoinMaintenanceDeleteSummary
}

export function isDeleteCoinReady(
  confirmationTitle: string,
  currentTitle: string,
  isPending: boolean
) {
  return confirmationTitle === currentTitle && !isPending
}

function createDeleteRows(deleteSummary: CoinMaintenanceDeleteSummary) {
  return [
    ["Ruler Attributions", deleteSummary.rulerAttributions],
    ["Mint Attributions", deleteSummary.mintAttributions],
    ["Theme Attributions", deleteSummary.themeAttributions],
    ["Catalogue References", deleteSummary.catalogueReferences],
    ["Coin Surfaces", deleteSummary.coinSurfaces],
    ["Engraver Attributions", deleteSummary.engraverAttributions],
  ] as const
}

function DeleteSummaryRows({
  deleteSummary,
}: {
  deleteSummary: CoinMaintenanceDeleteSummary
}) {
  const rows = createDeleteRows(deleteSummary)

  return (
    <dl className="grid gap-2 text-sm">
      {rows.map(([label, count]) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <dt>{label}:</dt>
          <dd>{count}</dd>
        </div>
      ))}
    </dl>
  )
}

function applyDeleteResult(
  result: CoinDeleteMutationResult,
  setConfirmationError: (value: string | null) => void,
  setFormError: (value: string | null) => void
) {
  if (result.status === "success") {
    setConfirmationError(null)
    setFormError(null)
    return result
  }

  setConfirmationError(result.fieldErrors.confirmationTitle ?? null)
  setFormError(result.formError ?? null)

  return null
}

export function DeleteCoin({ coinId, deleteSummary }: DeleteCoinProps) {
  const deleteCoin = useServerFn(deleteCoinAction)
  const [confirmationTitle, setConfirmationTitle] = useState("")
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  function resetState() {
    setConfirmationTitle("")
    setConfirmationError(null)
    setFormError(null)
    setIsPending(false)
  }

  async function handleDeleteCoin() {
    setConfirmationError(null)
    setFormError(null)
    setIsPending(true)

    try {
      const result = await deleteCoin({
        data: {
          id: coinId,
          confirmationTitle,
        },
      })

      const successResult = applyDeleteResult(
        result,
        setConfirmationError,
        setFormError
      )

      if (!successResult) {
        return
      }

      setIsOpen(false)
      window.location.assign(successResult.redirectTo)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="border border-destructive">
      <CardHeader>
        <CardTitle>Delete Coin</CardTitle>
        <CardDescription>
          This permanently deletes the Coin and its owned child records. Shared
          lookup records remain untouched.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm">
          Type <span className="font-medium">{deleteSummary.title}</span> exactly in
          the confirmation dialog before deletion is enabled.
        </p>
        <DeleteSummaryRows deleteSummary={deleteSummary} />
      </CardContent>
      <CardFooter className="flex justify-end">
        <AlertDialog
          open={isOpen}
          onOpenChange={(nextOpen) => {
            setIsOpen(nextOpen)

            if (!nextOpen) {
              resetState()
            }
          }}
        >
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Delete Coin
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Coin?</AlertDialogTitle>
              <AlertDialogDescription>
                Review the cascade before deleting this Coin.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <DeleteSummaryRows deleteSummary={deleteSummary} />

              <div className="grid gap-2">
                <Label htmlFor="confirm-coin-deletion">
                  Type <span className="font-medium">{deleteSummary.title}</span> to
                  confirm Coin deletion.
                </Label>
                <Input
                  id="confirm-coin-deletion"
                  name="confirmationTitle"
                  value={confirmationTitle}
                  onChange={(event) => setConfirmationTitle(event.target.value)}
                />
                {confirmationError ? (
                  <p className="text-sm text-destructive">{confirmationError}</p>
                ) : null}
                {formError ? (
                  <p className="text-sm text-destructive">{formError}</p>
                ) : null}
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel variant="outline" disabled={isPending}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDeleteCoin}
                disabled={
                  !isDeleteCoinReady(
                    confirmationTitle,
                    deleteSummary.title,
                    isPending
                  )
                }
              >
                Delete Coin
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
