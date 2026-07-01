import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RimOption } from "@workspace/db"
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
  RIM_GENERIC_SAVE_ERROR,
  RIM_IN_USE_DELETE_ERROR,
  submitDeleteRim,
} from "@/lib/rim-maintenance"

import { RimCreateForm } from "./rim-create-form"
import { RimEditForm } from "./rim-edit-form"

type RimMaintenanceSheetProps = {
  rim: RimOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RIM_DELETE_CONFIRMATION_IN_USE_GUIDANCE = RIM_IN_USE_DELETE_ERROR.replace(
  "Rim cannot be deleted while Coins still use it. ",
  ""
)

export const RIM_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Rim. ${RIM_DELETE_CONFIRMATION_IN_USE_GUIDANCE}`

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
  const sheetTitle = isEditingRim ? "Edit Rim" : "Create Rim"

  function resetDeleteState() {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
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
          <SheetTitle>{sheetTitle}</SheetTitle>

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

        {isEditingRim ? (
          <RimEditForm rim={rim} onSaved={() => onOpenChange(false)} />
        ) : (
          <RimCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
