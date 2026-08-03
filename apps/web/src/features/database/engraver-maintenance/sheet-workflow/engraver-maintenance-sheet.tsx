import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Engraver } from "@coin-archive/api"
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
import { submitDeleteEngraver } from "../actions"
import { ENGRAVER_GENERIC_SAVE_ERROR } from "../engraver-mutation-errors"
import { ENGRAVER_DELETE_REASSIGN_REQUIRED_MESSAGE } from "../messages"

import { EngraverCreateForm } from "../form-workflow/engraver-create-form"
import { EngraverEditForm } from "../form-workflow/engraver-edit-form"

type EngraverMaintenanceSheetProps = {
  engraver: Engraver | null
  initialDeleteDialogOpen?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION = `This permanently deletes the Engraver. ${ENGRAVER_DELETE_REASSIGN_REQUIRED_MESSAGE}`

const deleteEngraverAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitDeleteEngraver(data))

export function EngraverMaintenanceSheet({
  engraver,
  initialDeleteDialogOpen = false,
  open,
  onOpenChange,
}: EngraverMaintenanceSheetProps) {
  const router = useRouter()
  const deleteEngraver = useServerFn(deleteEngraverAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingEngraver = engraver !== null

  function closeSheet() {
    onOpenChange(false)
  }

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(
      open && isEditingEngraver ? initialDeleteDialogOpen : false
    )
    setIsDeletePending(false)
  }, [engraver?.id, initialDeleteDialogOpen, isEditingEngraver, open])

  async function handleDeleteEngraver() {
    if (!engraver) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteEngraver({
        data: {
          id: engraver.id,
          etag: engraver.etag,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        closeSheet()
        return
      }

      setDeleteError(result.formError ?? ENGRAVER_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>
            {isEditingEngraver ? "Edit Engraver" : "Create Engraver"}
          </SheetTitle>

          {isEditingEngraver ? (
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
                    Delete Engraver
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Engraver?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteEngraver}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {engraver !== null ? (
          <EngraverEditForm engraver={engraver} onSaved={closeSheet} />
        ) : (
          <EngraverCreateForm onCreated={closeSheet} />
        )}
      </SheetContent>
    </Sheet>
  )
}
