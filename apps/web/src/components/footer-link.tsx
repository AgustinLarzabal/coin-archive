import type { ReactNode } from "react"
import { buttonVariants } from "@coin-archive/ui/components/button"
import { cn } from "@coin-archive/ui/lib/utils"

export function FooterLink({
  children,
  href,
}: {
  children: ReactNode
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        buttonVariants({
          variant: "ghost",
          size: "sm",
        }),
        "flex items-center justify-center gap-2"
      )}
    >
      {children}
    </a>
  )
}
