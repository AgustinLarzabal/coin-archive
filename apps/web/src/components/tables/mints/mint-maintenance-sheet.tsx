import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { MintOption } from "@workspace/db"
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
  MINT_GENERIC_SAVE_ERROR,
  MINT_IN_USE_DELETE_GUIDANCE,
  submitDeleteMint,
} from "@/lib/mint-maintenance"

import { MintCreateForm } from "./mint-create-form"
import { MintEditForm } from "./mint-edit-form"

type MintMaintenanceSheetProps = {
  mint: MintOption | null
  initialDeleteDialogOpen?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MINT_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Mint. ${MINT_IN_USE_DELETE_GUIDANCE}`

const deleteMintAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteMint(session?.user ?? null, data)
  })

export function MintMaintenanceSheet({
  mint,
  initialDeleteDialogOpen = false,
  open,
  onOpenChange,
}: MintMaintenanceSheetProps) {
  const router = useRouter()
  const deleteMint = useServerFn(deleteMintAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingMint = mint !== null
  const sheetTitle = isEditingMint ? "Edit Mint" : "Create Mint"

  function closeSheet() {
    onOpenChange(false)
  }

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(
      open && isEditingMint ? initialDeleteDialogOpen : false
    )
    setIsDeletePending(false)
  }, [initialDeleteDialogOpen, isEditingMint, mint?.id, open])

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
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        closeSheet()
        return
      }

      setDeleteError(result.formError ?? MINT_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{sheetTitle}</SheetTitle>

          {isEditingMint ? (
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
                    Delete Mint
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

        {isEditingMint ? (
          <MintEditForm mint={mint} onSaved={closeSheet} />
        ) : (
          <MintCreateForm onCreated={closeSheet} />
        )}
      </SheetContent>
    </Sheet>
  )
}
