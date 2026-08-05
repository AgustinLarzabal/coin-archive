import { BookOpen } from "lucide-react"
import { FooterLink } from "./footer-link"

export function ApiReferenceLink({ href }: { href: string }) {
  return (
    <FooterLink href={href}>
      <BookOpen />
      <span className="text-xs text-muted-foreground">API Reference</span>
    </FooterLink>
  )
}
