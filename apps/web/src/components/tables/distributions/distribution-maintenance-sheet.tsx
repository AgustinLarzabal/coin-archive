import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import { DistributionCreateForm } from "./distribution-create-form"

type DistributionMaintenanceSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DistributionMaintenanceSheet({
  open,
  onOpenChange,
}: DistributionMaintenanceSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Create Distribution</SheetTitle>
        </SheetHeader>

        <DistributionCreateForm onCreated={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
