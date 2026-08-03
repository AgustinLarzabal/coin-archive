import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { IssuerMaintenanceRecord } from "../issuer-maintenance-route-data"
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
import { submitDeleteIssuer } from "../actions"
import {
  ISSUER_DELETE_CONFIRMATION_DESCRIPTION,
  ISSUER_GENERIC_SAVE_ERROR,
} from "../messages"

import { IssuerCreateForm } from "../form-workflow/issuer-create-form"
import { IssuerEditForm } from "../form-workflow/issuer-edit-form"

export { ISSUER_DELETE_CONFIRMATION_DESCRIPTION } from "../messages"

type IssuerMaintenanceSheetProps = {
  issuer: IssuerMaintenanceRecord | null
  initialDeleteDialogOpen?: boolean
  issuers: IssuerMaintenanceRecord[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const deleteIssuerAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitDeleteIssuer(data))

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
          etag: issuer.etag,
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
