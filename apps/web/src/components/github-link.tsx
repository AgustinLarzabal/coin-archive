import { buttonVariants } from "@coin-archive/ui/components/button"
import { Icons } from "./icons"
import { cn } from "@coin-archive/ui/lib/utils"

export function GitHubLink() {
  return (
    <a
      href="https://github.com/AgustinLarzabal/coin-archive"
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
      <Icons.GitHub />
      <span className="text-xs text-muted-foreground">GitHub</span>
    </a>
  )
}
