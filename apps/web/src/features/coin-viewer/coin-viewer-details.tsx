import { Badge } from "@coin-archive/ui/components/badge"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { Separator } from "@coin-archive/ui/components/separator"
import { Link } from "@tanstack/react-router"
import { isIsoIssuerCode } from "../issuer"
import type { CoinDetailResponse } from "@coin-archive/api"

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
        <h2 className="mb-4 font-mono text-base">
          {coin.title}
          {coin.faceValue && ` · ${coin.faceValue.label}`}
        </h2>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {isIsoIssuerCode(coin.issuer.code) && (
            <Flag code={coin.issuer.code} width={16} decorative />
          )}
          <span>{coin.issuer.name}</span>
          {attributionGroups.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <div>
                {attributionGroups.map((group, groupIndex) => (
                  <div
                    className="flex justify-between gap-1"
                    key={`${group.role}-${groupIndex}`}
                  >
                    <span>{group.role}:</span>
                    <div className="text-right">
                      {group.attributions.map(
                        (attribution, attributionIndex) => (
                          <div key={`${attribution.slug}-${attributionIndex}`}>
                            {attribution.name}
                            {attribution.tenure
                              ? ` (${attribution.tenure})`
                              : ""}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <Separator className="mt-6 mb-4" />
        <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
          <Badge variant="outline">
            {formatIssuePeriod(coin.firstIssueYear, coin.lastIssueYear)}
          </Badge>
          <span aria-hidden="true">·</span>
          <span>{coin.distributionName}</span>
          {coin.demonetized === true && (
            <Badge variant="secondary" className="ml-auto">
              Demonetized
            </Badge>
          )}
        </div>
        <Separator className="mt-4 mb-6" />

        <div className="flex gap-10 border-b font-mono text-xs text-muted-foreground">
          <div className="flex-1">
            <ul>
              {coin.faceValue && (
                <li className="flex items-center justify-between border-b py-2">
                  <span>Face Value</span>
                  <span>{coin.faceValue.label}</span>
                </li>
              )}
              {coin.size !== null && (
                <li className="flex items-center justify-between border-b py-2">
                  <span>Size</span>
                  <span>{coin.size} mm</span>
                </li>
              )}
              {coin.weight !== null && (
                <li className="flex items-center justify-between border-b py-2">
                  <span>Weight</span>
                  <span>{coin.weight} g</span>
                </li>
              )}
              {coin.thickness !== null && (
                <li className="flex items-center justify-between py-2">
                  <span>Thickness</span>
                  <span>{coin.thickness} mm</span>
                </li>
              )}
            </ul>
          </div>
          <div className="flex-1">
            <ul>
              {coin.faceValue && (
                <li className="flex items-center justify-between border-b py-2">
                  <span>Currency</span>
                  <span>{coin.faceValue.currency.fullName}</span>
                </li>
              )}
              {coin.compositionName !== null && (
                <li className="flex items-center justify-between border-b py-2">
                  <span>Composition</span>
                  <span>{coin.compositionName}</span>
                </li>
              )}
              {coin.compositionDetail !== null && (
                <li className="flex items-center justify-between border-b py-2">
                  <span>Composition Detail</span>
                  <span>{coin.compositionDetail}</span>
                </li>
              )}
              {coin.orientation !== null && (
                <li className="flex items-center justify-between border-b py-2">
                  <span>Orientation</span>
                  <span>{coin.orientation}</span>
                </li>
              )}
              {coin.shapeName !== null && (
                <li className="flex items-center justify-between border-b py-2">
                  <span>Shape</span>
                  <span>{coin.shapeName}</span>
                </li>
              )}
              {coin.techniqueName !== null && (
                <li className="flex items-center justify-between py-2">
                  <span>Technique</span>
                  <span>{coin.techniqueName}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {coin.mints.length > 0 && (
          <div className="flex justify-between gap-4 py-2 font-mono text-xs text-muted-foreground">
            <span>Mint</span>
            <div className="text-right">
              {coin.mints.map((mint) => (
                <div key={mint.slug}>
                  <div>{mint.name}</div>
                  <div>
                    {mint.place}, {mint.country.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {coin.tags.length > 0 && (
          <div className="mt-10 flex items-center gap-4 text-[10px] uppercase">
            {coin.tags.map((tag) => (
              <Link
                key={tag.slug}
                to="/"
                search={{ tag: tag.slug }}
                aria-label={tag.name}
              >
                <Badge variant="secondary" className="text-xs">
                  # {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
