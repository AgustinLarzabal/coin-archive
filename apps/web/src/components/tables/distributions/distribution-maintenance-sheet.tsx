import type { DistributionOption } from "@workspace/db"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import { DistributionCreateForm } from "./distribution-create-form"
import { DistributionEditForm } from "./distribution-edit-form"

type DistributionMaintenanceSheetProps = {
  distribution: DistributionOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DistributionMaintenanceSheet({
  distribution,
  open,
  onOpenChange,
}: DistributionMaintenanceSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>
            {distribution ? "Edit Distribution" : "Create Distribution"}
          </SheetTitle>
        </SheetHeader>

        {distribution ? (
          <DistributionEditForm
            distribution={distribution}
            onSaved={() => onOpenChange(false)}
          />
        ) : (
          <DistributionCreateForm onCreated={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  )
}
