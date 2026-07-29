import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@coin-archive/ui/components/sheet"
import type { TechniqueOption } from "@coin-archive/db"

import { Icons } from "@/components/icons"
import { getAuthSession } from "@/lib/auth-session"
import {
  MINTING_TECHNIQUE_GENERIC_SAVE_ERROR,
  MINTING_TECHNIQUE_IN_USE_DELETE_GUIDANCE,
  submitDeleteMintingTechnique,
} from "../actions"

import { MintingTechniqueCreateForm } from "../form-workflow/minting-technique-create-form"
import { MintingTechniqueEditForm } from "../form-workflow/minting-technique-edit-form"

type MintingTechniqueMaintenanceSheetProps = {
  mintingTechnique: TechniqueOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MINTING_TECHNIQUE_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Minting Technique. ${MINTING_TECHNIQUE_IN_USE_DELETE_GUIDANCE}`

const deleteMintingTechniqueAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteMintingTechnique(session?.user ?? null, data)
  })

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
  const isEditingMintingTechnique = mintingTechnique !== null
  const sheetTitle = isEditingMintingTechnique
    ? "Edit Minting Technique"
    : "Create Minting Technique"

  function resetDeleteState() {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }

  useEffect(() => {
    resetDeleteState()
  }, [mintingTechnique?.id, open])

  function closeSheet() {
    onOpenChange(false)
  }

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
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(
        result.formError ?? MINTING_TECHNIQUE_GENERIC_SAVE_ERROR
      )
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{sheetTitle}</SheetTitle>

          {isEditingMintingTechnique ? (
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

        {isEditingMintingTechnique ? (
          <MintingTechniqueEditForm
            mintingTechnique={mintingTechnique}
            onSaved={closeSheet}
          />
        ) : (
          <MintingTechniqueCreateForm onCreated={closeSheet} />
        )}
      </SheetContent>
    </Sheet>
  )
}
