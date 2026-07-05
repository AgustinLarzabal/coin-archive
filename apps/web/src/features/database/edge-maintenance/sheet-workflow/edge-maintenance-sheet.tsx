import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { EdgeOption } from "@workspace/db"
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
  EDGE_GENERIC_SAVE_ERROR,
  EDGE_IN_USE_DELETE_ERROR,
  submitDeleteEdge,
} from "../actions"

import { EdgeCreateForm } from "../form-workflow/edge-create-form"
import { EdgeEditForm } from "../form-workflow/edge-edit-form"

type EdgeMaintenanceSheetProps = {
  edge: EdgeOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EDGE_DELETE_CONFIRMATION_IN_USE_GUIDANCE = EDGE_IN_USE_DELETE_ERROR.replace(
  "Edge cannot be deleted while Coins still use it. ",
  ""
)

export const EDGE_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Edge. ${EDGE_DELETE_CONFIRMATION_IN_USE_GUIDANCE}`

const deleteEdgeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteEdge(session?.user ?? null, data)
  })

export function EdgeMaintenanceSheet({
  edge,
  open,
  onOpenChange,
}: EdgeMaintenanceSheetProps) {
  const router = useRouter()
  const deleteEdge = useServerFn(deleteEdgeAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingEdge = edge !== null
  const sheetTitle = isEditingEdge ? "Edit Edge" : "Create Edge"

  function resetDeleteState() {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }

  useEffect(() => {
    resetDeleteState()
  }, [edge?.id, open])

  async function handleDeleteEdge() {
    if (!edge) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteEdge({
        data: {
          id: edge.id,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(result.formError ?? EDGE_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{sheetTitle}</SheetTitle>

          {isEditingEdge ? (
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
                    <AlertDialogTitle>Delete Edge?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {EDGE_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteEdge}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {isEditingEdge ? (
          <EdgeEditForm edge={edge} onSaved={() => onOpenChange(false)} />
        ) : (
          <EdgeCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
