import { isIsoIssuerCode } from "@workspace/api"
import { Flag } from "@workspace/ui/components/flags/flag"
import type { CoinDetailResponse } from "@workspace/api"

import { formatIssuePeriod } from "@/features/issue-period"

export function CoinViewerDetails({ coin }: { coin: CoinDetailResponse }) {
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
          <span>•</span>
          <span>Ruler / Period</span>
        </div>
        <dl className="mt-6 font-mono text-xs">
          <div className="flex justify-between gap-4 border-t pt-3">
            <dt className="text-muted-foreground">Issue Period</dt>
            <dd>
              {formatIssuePeriod(coin.firstIssueYear, coin.lastIssueYear)}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  )
}
