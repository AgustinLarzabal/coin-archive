import type { CoinListRecord } from "@workspace/db"
import { Link } from "@tanstack/react-router"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type CoinCardProps = {
  coin: CoinListRecord
}

export function CoinCard({ coin }: CoinCardProps) {
  return (
    <Link
      className="block outline-none focus-visible:ring-1 focus-visible:ring-ring"
      params={{ coinId: coin.id }}
      to="/coins/$coinId"
    >
      <Card className="transition-colors hover:bg-muted/30">
        <CardHeader>
          <CardTitle>{coin.title}</CardTitle>
          <CardDescription>{coin.issuer.name}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
