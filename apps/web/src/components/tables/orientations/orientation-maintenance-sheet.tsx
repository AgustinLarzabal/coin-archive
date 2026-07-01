import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { OrientationOption } from "@workspace/db"
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
  ORIENTATION_GENERIC_SAVE_ERROR,
  ORIENTATION_IN_USE_DELETE_ERROR,
  submitDeleteOrientation,
} from "@/lib/orientation-maintenance"

import { OrientationCreateForm } from "./orientation-create-form"
import { OrientationEditForm } from "./orientation-edit-form"

type OrientationMaintenanceSheetProps = {
  orientation: OrientationOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ORIENTATION_DELETE_CONFIRMATION_IN_USE_GUIDANCE = ORIENTATION_IN_USE_DELETE_ERROR.replace(
  "Orientation cannot be deleted while Coins still use it. ",
  ""
)

export const ORIENTATION_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Orientation. ${ORIENTATION_DELETE_CONFIRMATION_IN_USE_GUIDANCE}`

const deleteOrientationAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteOrientation(session?.user ?? null, data)
  })

export function OrientationMaintenanceSheet({
  orientation,
  open,
  onOpenChange,
}: OrientationMaintenanceSheetProps) {
  const router = useRouter()
  const deleteOrientation = useServerFn(deleteOrientationAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingOrientation = orientation !== null
  const sheetTitle = isEditingOrientation ? "Edit Orientation" : "Create Orientation"

  function resetDeleteState() {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }

  useEffect(() => {
    resetDeleteState()
  }, [orientation?.id, open])

  async function handleDeleteOrientation() {
    if (!orientation) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteOrientation({
        data: {
          id: orientation.id,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(result.formError ?? ORIENTATION_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{sheetTitle}</SheetTitle>

          {isEditingOrientation ? (
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
                    <AlertDialogTitle>Delete Orientation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {ORIENTATION_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteOrientation}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {isEditingOrientation ? (
          <OrientationEditForm orientation={orientation} onSaved={() => onOpenChange(false)} />
        ) : (
          <OrientationCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
