import type { CoinRecord } from "@workspace/db"

export function formatThemeNames(themes: CoinRecord["themes"]) {
  return themes.map(({ name }) => name).join(", ")
}

const mintageFormatter = new Intl.NumberFormat("en-US")
const detailClassName = "text-sm text-muted-foreground"

function formatMintage(mintage: number | null) {
  if (mintage === null) {
    return null
  }

  return mintageFormatter.format(mintage)
}

function formatDemonetizationStatus(isDemonetized: boolean | null) {
  if (isDemonetized === true) {
    return "Demonetized"
  }

  if (isDemonetized === false) {
    return "Not demonetized"
  }

  return "Unknown"
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
  const formattedMintage = formatMintage(coin.mintage)
  const demonetizationStatus = formatDemonetizationStatus(coin.isDemonetized)

  return (
    <li className="border-b border-border pb-4">
      <p className="font-medium">{coin.title}</p>
      <p className={detailClassName}>
        {coin.issuer.name} · {coin.distribution.name}
      </p>
      <p className={detailClassName}>Composition: {coin.composition.name}</p>
      <p className={detailClassName}>Face Value: {coin.faceValue.text}</p>
      <p className={detailClassName}>
        Demonetization Status: {demonetizationStatus}
      </p>
      {mintNames ? (
        <p className={detailClassName}>Mints: {mintNames}</p>
      ) : null}
      {themeNames ? (
        <p className={detailClassName}>Themes: {themeNames}</p>
      ) : null}
      {coin.shape ? (
        <p className={detailClassName}>Shape: {coin.shape.name}</p>
      ) : null}
      {coin.orientation ? (
        <p className={detailClassName}>Orientation: {coin.orientation.name}</p>
      ) : null}
      {coin.rim ? (
        <p className={detailClassName}>Rim: {coin.rim.name}</p>
      ) : null}
      {coin.edge?.name ? (
        <p className="text-sm text-muted-foreground">Edge: {coin.edge.name}</p>
      ) : null}
      {formattedMintage ? (
        <p className={detailClassName}>Mintage: {formattedMintage}</p>
      ) : null}
      <p className={detailClassName}>{issueYearRangeLabel}</p>
      {measurementSummary ? (
        <p className={detailClassName}>{measurementSummary}</p>
      ) : null}
      {coin.comments ? (
        <p className={detailClassName}>
          <span>Comments: </span>
          <span className="whitespace-pre-line">{coin.comments}</span>
        </p>
      ) : null}
    </li>
  )
}
