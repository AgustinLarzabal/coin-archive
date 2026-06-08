import type { CoinRecord } from "@workspace/db"

export function formatThemeNames(themes: CoinRecord["themes"]) {
  return themes.map(({ name }) => name).join(", ")
}

type CoinListItemProps = {
  coin: CoinRecord
  issueYearRangeLabel: string
  measurementSummary: string | null
  mintNames: string | null
}

export function CoinListItem({
  coin,
  issueYearRangeLabel,
  measurementSummary,
  mintNames,
}: CoinListItemProps) {
  const themeNames =
    coin.themes.length > 0 ? formatThemeNames(coin.themes) : null

  return (
    <li className="border-b border-border pb-4">
      <p className="font-medium">{coin.title}</p>
      <p className="text-sm text-muted-foreground">
        {coin.issuer.name} · {coin.distribution.name}
      </p>
      <p className="text-sm text-muted-foreground">
        Composition: {coin.composition.name}
      </p>
      <p className="text-sm text-muted-foreground">
        Face Value: {coin.faceValue.text}
      </p>
      {mintNames ? (
        <p className="text-sm text-muted-foreground">Mints: {mintNames}</p>
      ) : null}
      {themeNames ? (
        <p className="text-sm text-muted-foreground">Themes: {themeNames}</p>
      ) : null}
      {coin.orientation ? (
        <p className="text-sm text-muted-foreground">
          Orientation: {coin.orientation.name}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">{issueYearRangeLabel}</p>
      {measurementSummary ? (
        <p className="text-sm text-muted-foreground">{measurementSummary}</p>
      ) : null}
    </li>
  )
}
