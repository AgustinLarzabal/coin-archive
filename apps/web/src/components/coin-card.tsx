import type { CoinListRecord } from "@coin-archive/db"
import { Link } from "@tanstack/react-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@coin-archive/ui/components/card"
import type { CoinSearch } from "../lib/coin-search"
import { getCoinPreviewImageUrl } from "../lib/coin-images"

type CoinCardProps = {
  coin: CoinListRecord
  search?: CoinSearch
}

export function CoinCard({ coin, search }: CoinCardProps) {
  const previewImageUrl = getCoinPreviewImageUrl(coin.surfaces)

  return (
    <Link
      className="block outline-none focus-visible:ring-1 focus-visible:ring-ring"
      params={{ coinId: coin.id }}
      search={search}
      to="/coins/$coinId"
    >
      <Card className="p-0 pb-4 transition-colors hover:bg-muted/30">
        <CardContent className="flex flex-col gap-5 p-0">
          <div className="relative w-full overflow-hidden">
            <img src={previewImageUrl} alt={`${coin.title} preview`} className="object-cover" />
          </div>
        </CardContent>
        <CardHeader className="space-y-1">
          <CardTitle className="tracking-tight">{coin.title}</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/${coin.issuer.isoCode.toLowerCase()}.svg`}
                alt={coin.issuer.name}
                className="size-3 rounded-full object-cover"
              />
              <span className="text-xs tracking-tight">{coin.issuer.name}</span>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
