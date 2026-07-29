import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RimOption } from "@coin-archive/db"
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
import { getAuthSession } from "@/lib/auth-session"
import {
  RIM_DELETE_EXISTING_COINS_REASSIGN_REQUIRED_MESSAGE,
  RIM_GENERIC_SAVE_ERROR,
  submitDeleteRim,
} from "../actions"

import { RimCreateForm } from "../form-workflow/rim-create-form"
import { RimEditForm } from "../form-workflow/rim-edit-form"

type RimMaintenanceSheetProps = {
  rim: RimOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const RIM_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Rim. ${RIM_DELETE_EXISTING_COINS_REASSIGN_REQUIRED_MESSAGE}`

const deleteRimAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteRim(session?.user ?? null, data)
  })

export function RimMaintenanceSheet({
  rim,
  open,
  onOpenChange,
}: RimMaintenanceSheetProps) {
  const router = useRouter()
  const deleteRim = useServerFn(deleteRimAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingRim = rim !== null

  function resetDeleteState() {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }

  function handleDeleteDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDeleteState()
      return
    }

    setIsDeleteDialogOpen(true)
  }

  useEffect(() => {
    resetDeleteState()
  }, [rim?.id, open])

  async function handleDeleteRim() {
    if (!rim) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteRim({
        data: {
          id: rim.id,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(result.formError ?? RIM_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{rim ? "Edit Rim" : "Create Rim"}</SheetTitle>

          {isEditingRim ? (
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
                onOpenChange={handleDeleteDialogOpenChange}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Rim?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {RIM_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteRim}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {isEditingRim ? (
          <RimEditForm rim={rim} onSaved={() => onOpenChange(false)} />
        ) : (
          <RimCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
