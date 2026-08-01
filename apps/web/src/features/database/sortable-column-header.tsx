import type { ReactNode } from "react"
import type { Column } from "@tanstack/react-table"
import { Button } from "@coin-archive/ui/components/button"

import { Icons } from "@/components/icons"

type SortableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>
  children: ReactNode
}

export function SortableColumnHeader<TData, TValue>({
  column,
  children,
}: SortableColumnHeaderProps<TData, TValue>) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <Icons.ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}
