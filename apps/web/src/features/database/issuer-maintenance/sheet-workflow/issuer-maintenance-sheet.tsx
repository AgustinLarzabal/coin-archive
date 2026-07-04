import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "@workspace/db"
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
  ISSUER_GENERIC_SAVE_ERROR,
  submitDeleteIssuer,
} from "@/lib/issuer-maintenance"

import { IssuerCreateForm, IssuerEditForm } from "../form-workflow"

type IssuerMaintenanceSheetProps = {
  issuer: IssuerMaintenanceRecord | null
  initialDeleteDialogOpen?: boolean
  issuers: IssuerMaintenanceRecord[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ISSUER_DELETE_CONFIRMATION_DESCRIPTION =
  "This permanently deletes the Issuer. Deletion is blocked while Coins still use it or child Issuers still reference it."

const deleteIssuerAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteIssuer(session?.user ?? null, data)
  })

export function IssuerMaintenanceSheet({
  issuer,
  initialDeleteDialogOpen = false,
  issuers,
  open,
  onOpenChange,
}: IssuerMaintenanceSheetProps) {
  const router = useRouter()
  const deleteIssuer = useServerFn(deleteIssuerAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingIssuer = issuer !== null
  const sheetTitle = isEditingIssuer ? "Edit Issuer" : "Create Issuer"

  function closeSheet() {
    onOpenChange(false)
  }

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(
      open && isEditingIssuer ? initialDeleteDialogOpen : false
    )
    setIsDeletePending(false)
  }, [initialDeleteDialogOpen, isEditingIssuer, issuer?.id, open])

  async function handleDeleteIssuer() {
    if (!issuer) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteIssuer({
        data: {
          id: issuer.id,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        closeSheet()
        return
      }

      setDeleteError(result.formError ?? ISSUER_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{sheetTitle}</SheetTitle>

          {isEditingIssuer ? (
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
                    Delete Issuer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Issuer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {ISSUER_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteIssuer}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {isEditingIssuer ? (
          <IssuerEditForm
            issuer={issuer}
            issuers={issuers}
            onSaved={closeSheet}
          />
        ) : (
          <IssuerCreateForm issuers={issuers} onCreated={closeSheet} />
        )}
      </SheetContent>
    </Sheet>
  )
}
