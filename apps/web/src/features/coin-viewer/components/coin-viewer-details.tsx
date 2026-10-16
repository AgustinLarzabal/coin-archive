import { isIsoIssuerCode } from "@workspace/api"
import { Flag } from "@workspace/ui/components/flags/flag"
import type { CoinDetailResponse } from "@workspace/api"

import { formatIssuePeriod } from "@/features/issue-period"

function groupRulingAuthorityAttributionsByConsecutiveRole(
  coin: CoinDetailResponse
) {
  return coin.rulers.reduce<
    Array<{ role: string; attributions: CoinDetailResponse["rulers"] }>
  >((groups, attribution) => {
    const currentGroup = groups.at(-1)
    if (currentGroup?.role === attribution.role) {
      currentGroup.attributions.push(attribution)
    } else {
      groups.push({ role: attribution.role, attributions: [attribution] })
    }
    return groups
  }, [])
}

export function CoinViewerDetails({ coin }: { coin: CoinDetailResponse }) {
  const attributionGroups =
    groupRulingAuthorityAttributionsByConsecutiveRole(coin)

  return (
    <aside className="flex-1 border-l bg-sidebar">
      <div className="mb-2 p-6 pb-3">
        <h2 className="mb-4 font-mono text-base">{coin.title}</h2>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {isIsoIssuerCode(coin.issuer.code) && (
              <Flag code={coin.issuer.code} width={16} decorative />
            )}
            <span>{coin.issuer.name}</span>
          </div>
        </div>
        <dl className="mt-6 font-mono text-xs">
          <div className="flex justify-between gap-4 border-t pt-3">
            <dt className="text-muted-foreground">Issue Period</dt>
            <dd>
              {formatIssuePeriod(coin.firstIssueYear, coin.lastIssueYear)}
            </dd>
          </div>
          {attributionGroups.map((group, groupIndex) => (
            <div
              className="flex justify-between gap-4 border-t pt-3"
              key={`${group.role}-${groupIndex}`}
            >
              <dt className="text-muted-foreground">{group.role}</dt>
              <dd className="text-right">
                {group.attributions.map((attribution, attributionIndex) => (
                  <div key={`${attribution.slug}-${attributionIndex}`}>
                    {attribution.name}
                    {attribution.tenure ? ` (${attribution.tenure})` : ""}
                  </div>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  )
}
