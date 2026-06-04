import type { CoinCatalogueReference, CoinRecord } from "@workspace/db"

type CoinCardProps = {
  coin: CoinRecord
}

type CoinListProps = {
  coins: CoinRecord[]
}

type CoinRulerRecord = CoinRecord["rulers"][number]

function getCatalogueReferenceLabel(reference: CoinCatalogueReference) {
  return `${reference.catalogue.code} ${reference.number}`
}

function getRulerLabel(ruler: CoinRulerRecord) {
  return ruler.group ? `${ruler.name} · ${ruler.group.name}` : ruler.name
}

function CoinCard({ coin }: CoinCardProps) {
  const { issuer, references, rulers, title } = coin
  const rulerSummary =
    rulers.length > 0 ? rulers.map(getRulerLabel).join(", ") : "No ruler attributions"

  return (
    <article className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {issuer.name} · {issuer.code}
          </p>
        </div>

        <dl className="grid gap-3 text-sm md:grid-cols-[minmax(0,10rem)_1fr]">
          <dt className="font-medium text-foreground">Rulers</dt>
          <dd className="text-muted-foreground">{rulerSummary}</dd>

          <dt className="font-medium text-foreground">Catalogue references</dt>
          <dd>
            {references.length === 0 ? (
              <p className="text-muted-foreground">No catalogue references</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {references.map((reference) => (
                  <li
                    key={reference.id}
                    className="rounded-full border border-border bg-secondary px-3 py-1 text-xs"
                    title={reference.catalogue.title}
                  >
                    <span className="font-medium">
                      {getCatalogueReferenceLabel(reference)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {reference.catalogue.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </dl>
      </div>
    </article>
  )
}

export function CoinList({ coins }: CoinListProps) {
  if (coins.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-sm text-muted-foreground">
        No coins matched the selected filters.
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      {coins.map((coin) => (
        <CoinCard key={coin.id} coin={coin} />
      ))}
    </section>
  )
}
