import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { EngraverOption } from "@workspace/db"
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
  ENGRAVER_IN_USE_DELETE_ERROR,
  submitDeleteEngraver,
} from "@/lib/engraver-maintenance"

import { EngraverCreateForm } from "./engraver-create-form"
import { EngraverEditForm } from "./engraver-edit-form"

type EngraverMaintenanceSheetProps = {
  engraver: EngraverOption | null
  initialDeleteDialogOpen?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ENGRAVER_DELETE_CONFIRMATION_DESCRIPTION =
  "This permanently deletes the Engraver. Existing Engraver Attributions must be removed before the Engraver can be deleted."

const deleteEngraverAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteEngraver(session?.user ?? null, data)
  })

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
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        closeSheet()
        return
      }

      setDeleteError(result.formError ?? ENGRAVER_IN_USE_DELETE_ERROR)
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
