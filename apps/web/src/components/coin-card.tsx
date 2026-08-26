import type { CoinListRecord } from "@coin-archive/db"
import { Link } from "@tanstack/react-router"
import { Badge } from "@coin-archive/ui/components/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@coin-archive/ui/components/card"
import type { CoinSearch } from "../lib/coin-search"
import { getCoinPreviewImageUrl } from "../lib/coin-images"
import { Button } from "@coin-archive/ui/components/button"
import { Icons } from "./icons"

type CoinCardProps = {
  coin: CoinListRecord
  search?: CoinSearch
}

export function CoinCard({ coin, search }: CoinCardProps) {
  const previewImageUrl = getCoinPreviewImageUrl(coin.surfaces)
  const hasKnownIssueYearRange = coin.minYear !== null && coin.maxYear !== null
  const hasSingleYear = hasKnownIssueYearRange && coin.minYear === coin.maxYear

  return (
    <Link
      className="block h-full outline-none focus-visible:ring-1 focus-visible:ring-ring"
      params={{ coinId: coin.id }}
      search={search}
      to="/coins/$coinId"
    >
      <Card className="h-full p-0 pb-4 transition-colors hover:bg-muted/30">
        <CardContent className="flex flex-col gap-5 p-0">
          <div className="relative w-full overflow-hidden p-2">
            <img
              src={previewImageUrl}
              alt={`${coin.title} preview`}
              className="object-cover"
            />
          </div>
        </CardContent>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/${coin.issuer.isoCode.toLowerCase()}.svg`}
                alt={coin.issuer.name}
                className="size-3 rounded-full object-cover"
              />
              <span className="text-xs tracking-tight">{coin.issuer.name}</span>
            </div>
            {hasKnownIssueYearRange ? (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="tracking-wider uppercase">
                  {coin.minYear}
                </Badge>
                {hasSingleYear ? null : (
                  <>
                    -
                    <Badge
                      variant="outline"
                      className="tracking-wider uppercase"
                    >
                      {coin.maxYear}
                    </Badge>
                  </>
                )}
              </div>
            ) : null}
          </div>
          <CardTitle className="tracking-tight">{coin.title}</CardTitle>
        </CardHeader>
        <CardFooter className="mt-auto">
          <Button variant="outline" className="w-full">
            <Icons.HeartPlus /> Add to collection
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
