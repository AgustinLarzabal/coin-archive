import { buttonVariants } from "@coin-archive/ui/components/button"
import { cn } from "@coin-archive/ui/lib/utils"
import { BookOpen } from "lucide-react"

export function ApiReferenceLink({ href }: { href: string }) {
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
      <BookOpen />
      <span className="text-xs text-muted-foreground">API Reference</span>
    </a>
  )
}
