import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { MintingTechnique } from "@coin-archive/api"
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
import { submitDeleteMintingTechnique } from "../actions"
import { MINTING_TECHNIQUE_DELETE_REASSIGN_REQUIRED_MESSAGE } from "../messages"

import { MintingTechniqueCreateForm } from "../form-workflow/minting-technique-create-form"
import { MintingTechniqueEditForm } from "../form-workflow/minting-technique-edit-form"

type MintingTechniqueMaintenanceSheetProps = {
  mintingTechnique: MintingTechnique | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MINTING_TECHNIQUE_DELETE_CONFIRMATION_DESCRIPTION = `This permanently deletes the Minting Technique. ${MINTING_TECHNIQUE_DELETE_REASSIGN_REQUIRED_MESSAGE}`

const deleteMintingTechniqueAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitDeleteMintingTechnique(data))

export function MintingTechniqueMaintenanceSheet({
  mintingTechnique,
  open,
  onOpenChange,
}: MintingTechniqueMaintenanceSheetProps) {
  const router = useRouter()
  const deleteMintingTechnique = useServerFn(deleteMintingTechniqueAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }, [mintingTechnique?.id, open])

  async function handleDeleteMintingTechnique() {
    if (!mintingTechnique) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteMintingTechnique({
        data: {
          id: mintingTechnique.id,
          etag: mintingTechnique.etag,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(
        result.formError ?? "Unable to delete Minting Technique right now."
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
            {mintingTechnique
              ? "Edit Minting Technique"
              : "Create Minting Technique"}
          </SheetTitle>

          {mintingTechnique !== null ? (
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
                    <AlertDialogTitle>
                      Delete Minting Technique?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {MINTING_TECHNIQUE_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteMintingTechnique}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {mintingTechnique ? (
          <MintingTechniqueEditForm
            mintingTechnique={mintingTechnique}
            onSaved={() => onOpenChange(false)}
          />
        ) : (
          <MintingTechniqueCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
