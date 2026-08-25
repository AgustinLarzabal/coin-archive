import { getCollectorRole } from "@/lib/collector-role"
import { authClient, hasEditorAccess } from "@coin-archive/auth/client"
import { ApiReferenceLink } from "./api-reference-link"
import { FooterLink } from "./footer-link"
import { GitHubLink } from "./github-link"
import { Icons } from "./icons"

export function Footer({ apiReferenceUrl }: { apiReferenceUrl: string }) {
  const { data: session } = authClient.useSession()
  const role = getCollectorRole(session?.user ?? null)
  const canAccessDatabase = role !== null && hasEditorAccess(role)

  return (
    <div className="flex justify-end gap-1 border-t p-4">
      {canAccessDatabase && (
        <FooterLink href="/database" openInNewTab={false}>
          <Icons.Database size={20} />
          <span className="text-xs text-muted-foreground">Database</span>
        </FooterLink>
      )}
      <ApiReferenceLink href={apiReferenceUrl} />
      <GitHubLink />
    </div>
  )
}
