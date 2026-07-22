import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RulerGroupOption, RulerOption } from "@workspace/db"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import { Icons } from "@/components/icons"
import { getAuthSession } from "@/lib/auth-session"
import {
  RULER_GENERIC_SAVE_ERROR,
  RULER_IN_USE_DELETE_GUIDANCE,
  submitDeleteRuler,
} from "../actions"

import { RulerCreateForm } from "../form-workflow/ruler-create-form"
import { RulerEditForm } from "../form-workflow/ruler-edit-form"

type RulerMaintenanceSheetProps = {
  ruler: RulerOption | null
  rulerGroups: RulerGroupOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const RULER_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Ruler. ${RULER_IN_USE_DELETE_GUIDANCE}`

const deleteRulerAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteRuler(session?.user ?? null, data)
  })

export function RulerMaintenanceSheet({
  ruler,
  rulerGroups,
  open,
  onOpenChange,
}: RulerMaintenanceSheetProps) {
  const router = useRouter()
  const deleteRuler = useServerFn(deleteRulerAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingRuler = ruler !== null
  const sheetTitle = isEditingRuler ? "Edit Ruler" : "Create Ruler"

  function closeSheet() {
    onOpenChange(false)
  }

  function resetDeleteState() {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }

  useEffect(() => {
    resetDeleteState()
  }, [ruler?.id, open])

  async function handleDeleteRuler() {
    if (!ruler) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteRuler({
        data: {
          id: ruler.id,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        closeSheet()
        return
      }

      setDeleteError(result.formError ?? RULER_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{sheetTitle}</SheetTitle>

          {isEditingRuler ? (
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
                    <AlertDialogTitle>Delete Ruler?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {RULER_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteRuler}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {isEditingRuler ? (
          <RulerEditForm
            ruler={ruler}
            rulerGroups={rulerGroups}
            onSaved={closeSheet}
          />
        ) : (
          <RulerCreateForm rulerGroups={rulerGroups} onCreated={closeSheet} />
        )}
      </SheetContent>
    </Sheet>
  )
}
