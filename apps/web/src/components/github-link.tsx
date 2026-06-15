import { Link } from "@tanstack/react-router"
import { buttonVariants } from "@workspace/ui/components/button"
import { Icons } from "./icons"

export function GitHubLink() {
  return (
    <Link
      to="/"
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
    </Link>
  )
}
