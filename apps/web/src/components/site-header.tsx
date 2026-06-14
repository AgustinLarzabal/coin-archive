import { Link } from "@tanstack/react-router"
import { GitHubLink } from "./github-link"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-sm tracking-wider text-muted-foreground uppercase"
        >
          Coin Archive
        </Link>
        <GitHubLink />
      </div>
    </header>
  )
}
