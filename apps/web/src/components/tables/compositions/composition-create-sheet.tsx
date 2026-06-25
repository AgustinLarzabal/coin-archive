import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"

import { CompositionCreateForm } from "./composition-create-form"

type CompositionCreateSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CompositionCreateSheet({
  open,
  onOpenChange,
}: CompositionCreateSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>Create Composition</SheetTitle>
        </SheetHeader>

        <CompositionCreateForm onCreated={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
