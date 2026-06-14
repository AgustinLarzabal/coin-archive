import type { CoinRecord } from "@workspace/db"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type CoinCardProps = {
  coin: CoinRecord
}

export function CoinCard({ coin }: CoinCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{coin.title}</CardTitle>
        <CardDescription>
          {coin.issuer.name} · {coin.distribution.name}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
