import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import type { TechniqueOption } from "@workspace/db"

import { MintingTechniqueCreateForm } from "./minting-technique-create-form"
import { MintingTechniqueEditForm } from "./minting-technique-edit-form"

type MintingTechniqueMaintenanceSheetProps = {
  mintingTechnique: TechniqueOption | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MintingTechniqueMaintenanceSheet({
  mintingTechnique,
  open,
  onOpenChange,
}: MintingTechniqueMaintenanceSheetProps) {
  const isEditingMintingTechnique = mintingTechnique !== null
  const sheetTitle = isEditingMintingTechnique
    ? "Edit Minting Technique"
    : "Create Minting Technique"

  function closeSheet() {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false}>
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>{sheetTitle}</SheetTitle>
        </SheetHeader>

        {isEditingMintingTechnique ? (
          <MintingTechniqueEditForm
            mintingTechnique={mintingTechnique}
            onSaved={closeSheet}
          />
        ) : (
          <MintingTechniqueCreateForm onCreated={closeSheet} />
        )}
      </SheetContent>
    </Sheet>
  )
}
