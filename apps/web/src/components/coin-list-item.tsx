import type { CoinRecord } from "@workspace/db"

export function formatThemeNames(themes: CoinRecord["themes"]) {
  return themes.map(({ name }) => name).join(", ")
}

const mintageFormatter = new Intl.NumberFormat("en-US")
const detailClassName = "text-sm text-muted-foreground"
type DemonetizationStatus = CoinRecord["isDemonetized"]

function formatMintage(mintage: number | null) {
  if (mintage === null) {
    return null
  }

  return mintageFormatter.format(mintage)
}

function formatDemonetizationStatus(status: DemonetizationStatus) {
  if (status === true) {
    return "Demonetized"
  }

  if (status === false) {
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
  const formattedDemonetizationStatus = formatDemonetizationStatus(
    coin.isDemonetized
  )
  const optionalDetailLines = [
    mintNames ? `Mints: ${mintNames}` : null,
    themeNames ? `Themes: ${themeNames}` : null,
    coin.shape ? `Shape: ${coin.shape.name}` : null,
    coin.orientation ? `Orientation: ${coin.orientation.name}` : null,
    coin.rim ? `Rim: ${coin.rim.name}` : null,
    coin.technique ? `Minting Technique: ${coin.technique.name}` : null,
    coin.edge?.name ? `Edge: ${coin.edge.name}` : null,
    formattedMintage ? `Mintage: ${formattedMintage}` : null,
  ].filter((detailLine): detailLine is string => detailLine !== null)

  return (
    <li className="border-b border-border pb-4">
      <p className="font-medium">{coin.title}</p>
      <p className={detailClassName}>
        {coin.issuer.name} · {coin.distribution.name}
      </p>
      <p className={detailClassName}>Composition: {coin.composition.name}</p>
      <p className={detailClassName}>Face Value: {coin.faceValue.text}</p>
      <p className={detailClassName}>
        Demonetization Status: {formattedDemonetizationStatus}
      </p>
      {optionalDetailLines.map((detailLine) => (
        <p className={detailClassName} key={detailLine}>
          {detailLine}
        </p>
      ))}
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
