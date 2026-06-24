import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import type { CatalogueOption } from "@workspace/db"

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
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Icons } from "@/components/icons"
import { getAuthSession } from "@/lib/auth-session"
import { submitDeleteCatalogue } from "@/lib/catalogue-maintenance"
import { CatalogueEditForm } from "./catalogue-edit-form"

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
  const [isDeletePending, setIsDeletePending] = useState(false)

  useEffect(() => {
    setDeleteError(null)
  }, [catalogue?.id, open])

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

      setDeleteError(result.formError ?? "Unable to delete Catalogue right now.")
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Catalogue</SheetTitle>
          <SheetDescription>
            Update the catalogue code and title.
          </SheetDescription>
        </SheetHeader>

        {catalogue?.id && (
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
              <Icons.Ellipsis className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={10} align="end">
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    />
                  }
                >
                  Delete
                </AlertDialogTrigger>
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
                    <AlertDialogCancel disabled={isDeletePending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isDeletePending}
                      onClick={handleDeleteCatalogue}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {catalogue ? (
          <CatalogueEditForm
            catalogue={catalogue}
            onSaved={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
