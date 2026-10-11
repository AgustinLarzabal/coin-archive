import { isIsoIssuerCode } from "@workspace/api"
import { Flag } from "@workspace/ui/components/flags/flag"
import type { CoinDetailResponse } from "@workspace/api"

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
      </div>
    </aside>
  )
}
