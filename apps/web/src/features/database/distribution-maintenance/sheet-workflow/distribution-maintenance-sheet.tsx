import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Distribution } from "@coin-archive/api"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@coin-archive/ui/components/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@coin-archive/ui/components/alert-dialog"
import { Button } from "@coin-archive/ui/components/button"

import { Icons } from "@/components/icons"
import { submitDeleteDistribution } from "../actions"
import { DISTRIBUTION_DELETE_REASSIGN_REQUIRED_MESSAGE } from "../messages"

import { DistributionCreateForm } from "../form-workflow/distribution-create-form"
import { DistributionEditForm } from "../form-workflow/distribution-edit-form"

type DistributionMaintenanceSheetProps = {
  distribution: Distribution | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DISTRIBUTION_DELETE_CONFIRMATION_REASSIGNMENT_MESSAGE =
  DISTRIBUTION_DELETE_REASSIGN_REQUIRED_MESSAGE.replace(
    "those Coins",
    "existing Coins"
  )

export const DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION = `This permanently deletes the Distribution. ${DISTRIBUTION_DELETE_CONFIRMATION_REASSIGNMENT_MESSAGE}`

const deleteDistributionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitDeleteDistribution(data))

export function DistributionMaintenanceSheet({
  distribution,
  open,
  onOpenChange,
}: DistributionMaintenanceSheetProps) {
  const router = useRouter()
  const deleteDistribution = useServerFn(deleteDistributionAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }, [distribution?.id, open])

  async function handleDeleteDistribution() {
    if (!distribution) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteDistribution({
        data: {
          id: distribution.id,
          etag: distribution.etag,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(
        result.formError ?? "Unable to delete Distribution right now."
      )
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>
            {distribution ? "Edit Distribution" : "Create Distribution"}
          </SheetTitle>

          {distribution !== null ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full p-0"
                    />
                  }
                >
                  <Icons.MoreVertical className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={10} align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Distribution?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {deleteError ? (
                    <p className="text-sm text-destructive">{deleteError}</p>
                  ) : null}
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      variant="outline"
                      disabled={isDeletePending}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isDeletePending}
                      onClick={handleDeleteDistribution}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {distribution ? (
          <DistributionEditForm
            distribution={distribution}
            onSaved={() => onOpenChange(false)}
          />
        ) : (
          <DistributionCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
