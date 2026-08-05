import { ApiReferenceLink } from "./api-reference-link"
import { GitHubLink } from "./github-link"

export function Footer({ apiReferenceUrl }: { apiReferenceUrl: string }) {
  return (
    <div className="flex justify-end gap-1 border-t p-4">
      <ApiReferenceLink href={apiReferenceUrl} />
      <GitHubLink />
    </div>
  )
}
