import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Icons } from "./icons"

export function GitHubLink() {
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 shadow-none"
      render={
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2"
        >
          <Icons.GitHub />
          <span className="text-xs text-muted-foreground">GitHub</span>
        </Link>
      }
    />
  )
}
