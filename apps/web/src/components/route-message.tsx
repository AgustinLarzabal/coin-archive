import { Empty, EmptyHeader, EmptyTitle } from "@coin-archive/ui/components/empty"
import type { ReactNode } from "react"

export function RouteMessage({ children }: { children: ReactNode }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{children}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}
