import type { IssuerMaintenanceRecord } from "@workspace/db"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import { IssuerCreateForm } from "./issuer-create-form"

type IssuerMaintenanceSheetProps = {
  issuers: IssuerMaintenanceRecord[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IssuerMaintenanceSheet({
  issuers,
  open,
  onOpenChange,
}: IssuerMaintenanceSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Create Issuer</SheetTitle>
        </SheetHeader>

        <IssuerCreateForm issuers={issuers} onCreated={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
