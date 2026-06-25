import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { CompositionOption } from "@workspace/db"
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
import { submitDeleteComposition } from "@/lib/composition-maintenance"

import { CompositionCreateForm } from "./composition-create-form"
import { CompositionEditForm } from "./composition-edit-form"

type CompositionMaintenanceSheetProps = {
  composition: CompositionOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION =
  "This permanently deletes the Composition. Every Coin has exactly one Composition, so existing Coins must be reassigned to another Composition before this Composition can be deleted."

export function canDeleteCompositionFromSheet(
  composition: CompositionOption | null
) {
  return composition !== null
}

const deleteCompositionAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteComposition(session?.user ?? null, data)
  })

export function CompositionMaintenanceSheet({
  composition,
  open,
  onOpenChange,
}: CompositionMaintenanceSheetProps) {
  const router = useRouter()
  const deleteComposition = useServerFn(deleteCompositionAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }, [composition?.id, open])

  async function handleDeleteComposition() {
    if (!composition) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteComposition({
        data: {
          id: composition.id,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(
        result.formError ?? "Unable to delete Composition right now."
      )
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>
            {composition ? "Edit Composition" : "Create Composition"}
          </SheetTitle>

          {canDeleteCompositionFromSheet(composition) ? (
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
                    <AlertDialogTitle>Delete Composition?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {COMPOSITION_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteComposition}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {composition ? (
          <CompositionEditForm
            composition={composition}
            onSaved={() => onOpenChange(false)}
          />
        ) : (
          <CompositionCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
