import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Rim } from "@coin-archive/api"
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
import { submitDeleteRim } from "../actions"
import { RIM_DELETE_REASSIGN_REQUIRED_MESSAGE } from "../messages"

import { RimCreateForm } from "../form-workflow/rim-create-form"
import { RimEditForm } from "../form-workflow/rim-edit-form"

type RimMaintenanceSheetProps = {
  rim: Rim | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const RIM_DELETE_CONFIRMATION_DESCRIPTION = `This permanently deletes the Rim. ${RIM_DELETE_REASSIGN_REQUIRED_MESSAGE}`

const deleteRimAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitDeleteRim(data))

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

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
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
          etag: rim.etag,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(result.formError ?? "Unable to delete Rim right now.")
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{rim ? "Edit Rim" : "Create Rim"}</SheetTitle>

          {rim !== null ? (
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

        {rim ? (
          <RimEditForm rim={rim} onSaved={() => onOpenChange(false)} />
        ) : (
          <RimCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
