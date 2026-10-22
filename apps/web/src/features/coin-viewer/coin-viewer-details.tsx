import { isIsoIssuerCode } from "@coin-archive/api"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { Link } from "@tanstack/react-router"
import type { CoinDetailResponse } from "@coin-archive/api"

import { formatIssuePeriod } from "@/features/issue-period"

function formatMintPeriod(mint: CoinDetailResponse["mints"][number]) {
  const { startYear, endYear, operating } = mint
  if (startYear === null && endYear === null && operating === null)
    return "Unknown"
  if (startYear === null && endYear === null && operating === false)
    return "Unknown (closed)"
  if (startYear !== null && endYear !== null) {
    return formatIssuePeriod(startYear, endYear)
  }
  const first =
    startYear === null ? "Unknown" : formatIssuePeriod(startYear, startYear)
  const last =
    operating === true
      ? "ongoing"
      : endYear === null
        ? operating === false
          ? "unknown (closed)"
          : "unknown"
        : formatIssuePeriod(endYear, endYear)
  return `${first}–${last}`
}

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
          <div className="flex justify-between gap-4 border-t pt-3">
            <dt className="text-muted-foreground">Coin Distribution</dt>
            <dd>{coin.distributionName}</dd>
          </div>
          {coin.faceValue && (
            <>
              <div className="flex justify-between gap-4 border-t pt-3">
                <dt className="text-muted-foreground">Face Value</dt>
                <dd>{coin.faceValue.label}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3">
                <dt className="text-muted-foreground">Currency</dt>
                <dd>{coin.faceValue.currency.fullName}</dd>
              </div>
            </>
          )}
          {attributionGroups.map((group, groupIndex) => (
            <div
              className="flex justify-between gap-4 border-t pt-3"
              key={`${group.role}-${groupIndex}`}
            >
              <dt className="text-muted-foreground">{group.role}</dt>
              <dd className="text-right">
                {group.attributions.map((attribution, attributionIndex) => (
                  <div key={`${attribution.slug}-${attributionIndex}`}>
                    <Link
                      to="/"
                      search={{ ruler: attribution.slug }}
                      className="underline-offset-4 hover:underline"
                    >
                      {attribution.name}
                    </Link>
                    {attribution.tenure ? ` (${attribution.tenure})` : ""}
                  </div>
                ))}
              </dd>
            </div>
          ))}
          {coin.mints.length > 0 && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Mint</dt>
              <dd className="text-right">
                {coin.mints.map((mint) => (
                  <div key={mint.slug}>
                    <Link
                      to="/"
                      search={{ mint: mint.slug }}
                      className="underline-offset-4 hover:underline"
                    >
                      {mint.name}
                    </Link>
                    <div>
                      {mint.place}, {mint.country.name}
                    </div>
                    <div>{formatMintPeriod(mint)}</div>
                  </div>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </aside>
  )
}
