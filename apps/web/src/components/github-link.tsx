import { buttonVariants } from "@workspace/ui/components/button"
import { Icons } from "./icons"

export function GitHubLink() {
  return (
    <a
      href="https://github.com/AgustinLarzabal/coin-archive"
      target="_blank"
      rel="noreferrer"
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "flex items-center justify-center gap-2",
      })}
    >
      <Icons.GitHub />
      <span className="text-xs text-muted-foreground">GitHub</span>
    </a>
  )
}
