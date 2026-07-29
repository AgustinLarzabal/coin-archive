import { useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@coin-archive/ui/components/sheet"
import type { CatalogueOption } from "@coin-archive/db"

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
import { submitDeleteCatalogue } from "../actions"
import { CatalogueCreateForm } from "../form-workflow/catalogue-create-form"
import { CatalogueEditForm } from "../form-workflow/catalogue-edit-form"

type CatalogueEditSheetProps = {
  catalogue: CatalogueOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const deleteCatalogueMaintenanceCatalogue = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteCatalogue(session?.user ?? null, data)
  })

export function CatalogueEditSheet({
  catalogue,
  open,
  onOpenChange,
}: CatalogueEditSheetProps) {
  const router = useRouter()
  const deleteCatalogue = useServerFn(deleteCatalogueMaintenanceCatalogue)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)

  async function handleDeleteCatalogue() {
    if (!catalogue) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteCatalogue({
        data: {
          id: catalogue.id,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(
        result.formError ?? "Unable to delete Catalogue right now."
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
            {catalogue ? "Edit Catalogue" : "Create Catalogue"}
          </SheetTitle>

          {catalogue?.id && (
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
                    <AlertDialogTitle>Delete Catalogue?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes the catalogue. Existing coin
                      references must be removed first.
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
                      onClick={handleDeleteCatalogue}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </SheetHeader>

        {catalogue ? (
          <CatalogueEditForm
            catalogue={catalogue}
            onSaved={() => onOpenChange(false)}
          />
        ) : (
          <CatalogueCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
