import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Mint } from "@coin-archive/api"
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
import { submitDeleteMint } from "../actions"
import { MINT_DELETE_REASSIGN_REQUIRED_MESSAGE } from "../messages"

import { MintCreateForm } from "../form-workflow/mint-create-form"
import { MintEditForm } from "../form-workflow/mint-edit-form"

type MintMaintenanceSheetProps = {
  mint: Mint | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MINT_DELETE_CONFIRMATION_DESCRIPTION = `This permanently deletes the Mint. ${MINT_DELETE_REASSIGN_REQUIRED_MESSAGE}`

const deleteMintAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitDeleteMint(data))

export function MintMaintenanceSheet({
  mint,
  open,
  onOpenChange,
}: MintMaintenanceSheetProps) {
  const router = useRouter()
  const deleteMint = useServerFn(deleteMintAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }, [mint?.id, open])

  async function handleDeleteMint() {
    if (!mint) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteMint({
        data: {
          id: mint.id,
          etag: mint.etag,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        onOpenChange(false)
        return
      }

      setDeleteError(result.formError ?? "Unable to delete Mint right now.")
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{mint ? "Edit Mint" : "Create Mint"}</SheetTitle>

          {mint !== null ? (
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
                    <AlertDialogTitle>Delete Mint?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {MINT_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteMint}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {mint ? (
          <MintEditForm mint={mint} onSaved={() => onOpenChange(false)} />
        ) : (
          <MintCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
