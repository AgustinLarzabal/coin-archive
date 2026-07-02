import { useEffect, useState } from "react"
import { useRouter } from "@tanstack/react-router"
import { createServerFn, useServerFn } from "@tanstack/react-start"
import type { ThemeOption } from "@workspace/db"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import { Icons } from "@/components/icons"
import { getAuthSession } from "@/lib/auth-session"
import {
  submitDeleteTheme,
  THEME_GENERIC_SAVE_ERROR,
  THEME_IN_USE_DELETE_GUIDANCE,
} from "@/lib/theme-maintenance"

import { ThemeCreateForm } from "./theme-create-form"
import { ThemeEditForm } from "./theme-edit-form"

type ThemeMaintenanceSheetProps = {
  theme: ThemeOption | null
  open: boolean
  onCompleted?: (message: string) => void
  onOpenChange: (open: boolean) => void
}

export const THEME_DELETE_CONFIRMATION_DESCRIPTION =
  `This permanently deletes the Theme. ${THEME_IN_USE_DELETE_GUIDANCE}`

const deleteThemeAction = createServerFn({
  method: "POST",
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const session = await getAuthSession()

    return submitDeleteTheme(session?.user ?? null, data)
  })

export function ThemeMaintenanceSheet({
  theme,
  open,
  onCompleted,
  onOpenChange,
}: ThemeMaintenanceSheetProps) {
  const router = useRouter()
  const deleteTheme = useServerFn(deleteThemeAction)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeletePending, setIsDeletePending] = useState(false)
  const hasSelectedTheme = theme !== null

  function resetDeleteState() {
    setDeleteError(null)
    setIsDeleteDialogOpen(false)
    setIsDeletePending(false)
  }

  useEffect(() => {
    resetDeleteState()
  }, [theme?.id, open])

  function closeSheet() {
    onOpenChange(false)
  }

  function handleMutationSuccess(message: string) {
    onCompleted?.(message)
    closeSheet()
  }

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
            {hasSelectedTheme ? "Edit Theme" : "Create Theme"}
          </SheetTitle>

          {hasSelectedTheme ? (
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

        {hasSelectedTheme ? (
          <ThemeEditForm theme={theme} onSaved={handleMutationSuccess} />
        ) : (
          <ThemeCreateForm onCreated={handleMutationSuccess} />
        )}
      </SheetContent>
    </Sheet>
  )
}
