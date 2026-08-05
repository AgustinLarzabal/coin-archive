import { Icons } from "./icons"
import { FooterLink } from "./footer-link"

export function GitHubLink() {
  return (
    <FooterLink href="https://github.com/AgustinLarzabal/coin-archive">
      <Icons.GitHub />
      <span className="text-xs text-muted-foreground">GitHub</span>
    </FooterLink>
  )
}
