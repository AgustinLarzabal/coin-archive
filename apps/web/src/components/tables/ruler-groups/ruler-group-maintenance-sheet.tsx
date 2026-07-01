import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { RulerGroupOption } from "@workspace/db"
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
  RULER_GROUP_GENERIC_SAVE_ERROR,
  RULER_GROUP_IN_USE_DELETE_GUIDANCE,
  submitDeleteRulerGroup,
} from "@/lib/ruler-group-maintenance"

import { RulerGroupCreateForm } from "./ruler-group-create-form"
import { RulerGroupEditForm } from "./ruler-group-edit-form"

type RulerGroupMaintenanceSheetProps = {
  rulerGroup: RulerGroupOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const RULER_GROUP_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Ruler Group. ${RULER_GROUP_IN_USE_DELETE_GUIDANCE}`

const deleteRulerGroupAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteRulerGroup(session?.user ?? null, data)
  })

export function RulerGroupMaintenanceSheet({
  rulerGroup,
  open,
  onOpenChange,
}: RulerGroupMaintenanceSheetProps) {
  const router = useRouter()
  const deleteRulerGroup = useServerFn(deleteRulerGroupAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingRulerGroup = rulerGroup !== null
  const sheetTitle = isEditingRulerGroup
    ? "Edit Ruler Group"
    : "Create Ruler Group"

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
  }, [rulerGroup?.id, open])

  async function handleDeleteRulerGroup() {
    if (!rulerGroup) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteRulerGroup({
        data: {
          id: rulerGroup.id,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        closeSheet()
        return
      }

      setDeleteError(result.formError ?? RULER_GROUP_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{sheetTitle}</SheetTitle>

          {isEditingRulerGroup ? (
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
                    <AlertDialogTitle>Delete Ruler Group?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {RULER_GROUP_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteRulerGroup}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {isEditingRulerGroup ? (
          <RulerGroupEditForm
            rulerGroup={rulerGroup}
            onSaved={closeSheet}
          />
        ) : (
          <RulerGroupCreateForm onCreated={closeSheet} />
        )}
      </SheetContent>
    </Sheet>
  )
}
