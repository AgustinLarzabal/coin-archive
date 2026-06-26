import type { EngraverOption } from "@workspace/db"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

type EngraverMaintenanceSheetProps = {
  engraver: EngraverOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EngraverMaintenanceSheet({
  engraver,
  open,
  onOpenChange,
}: EngraverMaintenanceSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {engraver === null ? "Create Engraver" : "Edit Engraver"}
          </SheetTitle>
          <SheetDescription>
            Create, edit, and delete Engraver flows will be added in a later
            slice. This page currently provides read-only access to existing
            Engravers.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}
