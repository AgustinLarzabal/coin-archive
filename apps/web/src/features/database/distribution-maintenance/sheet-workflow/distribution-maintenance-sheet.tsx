import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { DistributionOption } from "@workspace/db"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"

import { Icons } from "@/components/icons"
import { getAuthSession } from "@/lib/auth-session"
import {
  DISTRIBUTION_DELETE_EXISTING_COINS_REASSIGN_REQUIRED_MESSAGE,
  DISTRIBUTION_GENERIC_SAVE_ERROR,
  submitDeleteDistribution,
} from "../actions"

import { DistributionCreateForm } from "../form-workflow/distribution-create-form"
import { DistributionEditForm } from "../form-workflow/distribution-edit-form"

type DistributionMaintenanceSheetProps = {
  distribution: DistributionOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const DISTRIBUTION_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Distribution. ${DISTRIBUTION_DELETE_EXISTING_COINS_REASSIGN_REQUIRED_MESSAGE}`

const deleteDistributionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteDistribution(session?.user ?? null, data)
  })

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
  const isEditingDistribution = distribution !== null

  function resetDeleteState() {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }

  useEffect(() => {
    resetDeleteState()
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
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(result.formError ?? DISTRIBUTION_GENERIC_SAVE_ERROR)
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

          {isEditingDistribution ? (
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
