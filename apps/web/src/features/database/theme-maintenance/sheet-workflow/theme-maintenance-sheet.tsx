import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { Theme } from "@coin-archive/api"
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
import { submitDeleteTheme } from "../actions"
import { THEME_GENERIC_SAVE_ERROR } from "../theme-mutation-errors"
import { THEME_DELETE_REASSIGN_REQUIRED_MESSAGE } from "../messages"

import { ThemeCreateForm } from "../form-workflow/theme-create-form"
import { ThemeEditForm } from "../form-workflow/theme-edit-form"

type ThemeMaintenanceSheetProps = {
  theme: Theme | null
  initialDeleteDialogOpen?: boolean
  open: boolean
  onCompleted?: (message: string) => void
  onOpenChange: (open: boolean) => void
}

export const THEME_DELETE_CONFIRMATION_DESCRIPTION = `This permanently deletes the Theme. ${THEME_DELETE_REASSIGN_REQUIRED_MESSAGE}`

const deleteThemeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string; etag: string }) => data)
  .handler(async ({ data }) => submitDeleteTheme(data))

export function ThemeMaintenanceSheet({
  theme,
  initialDeleteDialogOpen = false,
  open,
  onCompleted,
  onOpenChange,
}: ThemeMaintenanceSheetProps) {
  const router = useRouter()
  const deleteTheme = useServerFn(deleteThemeAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const isEditingTheme = theme !== null

  function closeSheet() {
    onOpenChange(false)
  }

  function handleMutationSuccess(message: string) {
    onCompleted?.(message)
    closeSheet()
  }

  useEffect(() => {
    setDeleteError(null)
    setIsDeleteDialogOpen(
      open && isEditingTheme ? initialDeleteDialogOpen : false
    )
    setIsDeletePending(false)
  }, [theme?.id, initialDeleteDialogOpen, isEditingTheme, open])

  async function handleDeleteTheme() {
    if (!theme) {
      return
    }

    setDeleteError(null)
    setIsDeletePending(true)

    try {
      const result = await deleteTheme({
        data: {
          id: theme.id,
          etag: theme.etag,
        },
      })

      if (result.status === "success") {
        await router.invalidate()
        handleMutationSuccess(result.message)
        return
      }

      setDeleteError(result.formError ?? THEME_GENERIC_SAVE_ERROR)
    } finally {
      setIsDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>
            {isEditingTheme ? "Edit Theme" : "Create Theme"}
          </SheetTitle>

          {isEditingTheme ? (
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
                    Delete Theme
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Theme?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {THEME_DELETE_CONFIRMATION_DESCRIPTION}
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
                      onClick={handleDeleteTheme}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </SheetHeader>

        {theme !== null ? (
          <ThemeEditForm theme={theme} onSaved={handleMutationSuccess} />
        ) : (
          <ThemeCreateForm onCreated={handleMutationSuccess} />
        )}
      </SheetContent>
    </Sheet>
  )
}
