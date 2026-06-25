import { getCoin } from "@workspace/db"
import type { CoinDetailRecord } from "@workspace/db"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Fragment } from "react"
import type { ReactNode } from "react"
import { z } from "zod"
import { ImageZoom } from "@workspace/ui/components/kibo-ui/image-zoom"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Badge } from "@workspace/ui/components/badge"
import type { CoinSearch } from "../../../lib/coin-search"
import { coinSearchSchema } from "../../../lib/coin-search"
import {
  getCoinPreviewImageUrl,
  getSurfaceImageUrl,
} from "../../../lib/coin-images"
import { RULER_FILTER_LABEL } from "../../../lib/ruler-filter"
import { buttonVariants } from "@workspace/ui/components/button"
import { ChevronLeft } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const coinParamsSchema = z.object({
  coinId: z.string(),
})

const coinIdSchema = z.uuid()

const getCoinData = createServerFn({ method: "GET" })
  .inputValidator(coinParamsSchema)
  .handler(async ({ data }) => {
    if (!coinIdSchema.safeParse(data.coinId).success) {
      throw notFound()
    }

    const coin = await getCoin(data.coinId)

    if (coin === null) {
      throw notFound()
    }

    return { coin }
  })

export const Route = createFileRoute("/_app/(public)/coins/$coinId")({
  validateSearch: coinSearchSchema,
  loader: ({ params }) => getCoinData({ data: params }),
  component: CoinRoute,
})

type CoinDetailPageProps = {
  coin: CoinDetailRecord
  backHomeSearch?: CoinSearch
}

type CoinDetailSurfaceView = {
  key: "obverse" | "reverse" | "edge"
  label: string
  description: string | null
  lettering: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  engravers: { code: string; name: string }[]
}

type CoinMetadataItemView = {
  key: string
  content: ReactNode
}

const wholeNumberFormatter = new Intl.NumberFormat("en-US")

function formatMintage(mintage: number | null) {
  if (mintage === null) {
    return null
  }

  return wholeNumberFormatter.format(mintage)
}

function mapCoinSurfaces(coin: CoinDetailRecord): CoinDetailSurfaceView[] {
  const surfaces = [
    {
      key: "obverse",
      label: "Obverse",
      surface: coin.surfaces.obverse,
    },
    {
      key: "reverse",
      label: "Reverse",
      surface: coin.surfaces.reverse,
    },
    {
      key: "edge",
      label: "Edge",
      surface: coin.surfaces.edge,
    },
  ] as const

  const mappedSurfaces: CoinDetailSurfaceView[] = []

  for (const { key, label, surface } of surfaces) {
    if (surface === null) {
      continue
    }

    const mappedSurface: CoinDetailSurfaceView = {
      key,
      label,
      description: surface.description,
      lettering: surface.lettering,
      imageUrl: surface.imageUrl,
      thumbnailUrl: surface.thumbnailUrl,
      engravers: "engravers" in surface ? surface.engravers : [],
    }

    mappedSurfaces.push(mappedSurface)
  }

  return mappedSurfaces
}

function CoinRoute() {
  const { coin } = Route.useLoaderData()
  const search = Route.useSearch()

  return <CoinDetailPage coin={coin} backHomeSearch={search} />
}

export function CoinDetailPage({ coin, backHomeSearch }: CoinDetailPageProps) {
  const coinSurfaces = mapCoinSurfaces(coin)
  const hasKnownIssueYearRange = coin.minYear !== null && coin.maxYear !== null
  const hasSingleYear = hasKnownIssueYearRange && coin.minYear === coin.maxYear
  const metadataItems: CoinMetadataItemView[] = [
    {
      key: "issuer",
      content: (
        <div className="flex items-center gap-2">
          <img
            src={`https://flagcdn.com/${coin.issuer.isoCode.toLowerCase()}.svg`}
            alt={coin.issuer.name}
            className="size-3.5 rounded-full object-cover"
          />
          <Link
            to="/"
            search={{ issuer: coin.issuer.code }}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            title={`Filter homepage by issuer: ${coin.issuer.name}`}
            aria-label={`Show homepage coins filtered by issuer ${coin.issuer.name}`}
          >
            {coin.issuer.name}
          </Link>
        </div>
      ),
    },
  ]

  if (coin.rulers.length > 0) {
    metadataItems.push({
      key: "rulers",
      content: (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {coin.rulers.map((ruler) => {
              return (
                <Link
                  key={ruler.code}
                  to="/"
                  search={{ issuer: coin.issuer.code, ruler: ruler.code }}
                  className="underline-offset-4 hover:underline"
                  title={`Filter homepage by ${`issuer ${coin.issuer.name} and "${RULER_FILTER_LABEL}" ${ruler.name}`}`}
                  aria-label={`Show homepage coins filtered by ${`issuer ${coin.issuer.name} and "${RULER_FILTER_LABEL}" ${ruler.name}`}`}
                >
                  {ruler.name}
                </Link>
              )
            })}
          </div>
        </div>
      ),
    })
  }

  if (coin.references.length > 0) {
    metadataItems.push({
      key: "references",
      content: (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {coin.references.map((ref, index) => (
            <Fragment key={`${ref.catalogue.code}-${ref.number}`}>
              <Tooltip>
                <TooltipTrigger>
                  {ref.catalogue.code}: {ref.number}
                </TooltipTrigger>
                <TooltipContent>{ref.catalogue.title}</TooltipContent>
              </Tooltip>
              {index < coin.references.length - 1 ? (
                <Separator orientation="vertical" />
              ) : null}
            </Fragment>
          ))}
        </div>
      ),
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6 py-10 pb-20">
      <Link
        to="/"
        search={backHomeSearch}
        className={cn(
          buttonVariants({
            variant: "link",
            size: "sm",
          }),
          "mb-4 w-fit px-0 text-sm text-muted-foreground"
        )}
      >
        <ChevronLeft />
        Home
      </Link>

      <h1 className="max-w-[60%] text-2xl">{coin.title}</h1>

      <section className="flex justify-between gap-10">
        <div className="w-full max-w-[60%] space-y-4">
          <div className="flex items-center gap-4">
            {metadataItems.map((item, index) => (
              <Fragment key={item.key}>
                {item.content}
                {index < metadataItems.length - 1 ? (
                  <span className="text-muted-foreground">•</span>
                ) : null}
              </Fragment>
            ))}
          </div>

          <Separator />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {coin.isDemonetized && (
              <>
                <Badge
                  variant="secondary"
                  className="text-[10px] tracking-wider uppercase"
                >
                  Demonetized
                </Badge>
                <span className="text-muted-foreground">•</span>
              </>
            )}
            <Link
              to="/"
              search={{ distribution: coin.distribution.code }}
              className="underline-offset-4 hover:underline"
              title={`Filter homepage by distribution: ${coin.distribution.name}`}
              aria-label={`Show homepage coins filtered by distribution ${coin.distribution.name}`}
            >
              {coin.distribution.name}
            </Link>
            {hasKnownIssueYearRange ? (
              <div className="ml-auto flex items-center gap-1">
                {hasSingleYear ? "Year:" : "Years:"}
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

          <Separator />

          <div>
            {coinSurfaces.map((surface) => (
              <div
                key={surface.key}
                className="space-y-4 [&:not(:last-child)]:mb-10"
              >
                <p className="text-sm font-semibold">{surface.label}</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {surface.description}
                </p>
                <p className="text-sm">
                  Lettering:{" "}
                  <span className="text-sm leading-6 text-muted-foreground">
                    {surface.lettering}
                  </span>
                </p>
                {surface.engravers.map((engraver) => (
                  <p key={engraver.code} className="text-sm">
                    Engraver:{" "}
                    <span className="text-sm leading-6 text-muted-foreground">
                      <Link
                        to="/"
                        search={{ engraver: engraver.code }}
                        className="underline-offset-4 hover:underline"
                        title={`Filter homepage by distribution: ${engraver.name}`}
                        aria-label={`Show homepage coins filtered by distribution ${engraver.name}`}
                      >
                        {engraver.name}
                      </Link>
                    </span>
                  </p>
                ))}
              </div>
            ))}
          </div>

          <Separator />

          <div className="mb-0 flex gap-10">
            <div className="flex-1">
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Face Value</span>
                <span className="text-muted-foreground tabular-nums">
                  {coin.faceValue.text}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Weight</span>
                <span className="text-muted-foreground tabular-nums">
                  {coin.weight} gr
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Diameter</span>
                <span className="text-muted-foreground tabular-nums">
                  {coin.diameter} mm
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Thickness</span>
                <span className="text-muted-foreground tabular-nums">
                  {coin.thickness} mm
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Mintage</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatMintage(coin.mintage)}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Currency</span>
                <span className="text-muted-foreground tabular-nums">
                  {coin.faceValue.currency.fullName}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Orientation</span>
                <span className="text-muted-foreground tabular-nums">
                  {coin.orientation?.name}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Shape</span>
                <span className="text-muted-foreground tabular-nums">
                  {coin.shape?.name}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Technique</span>
                <span className="text-muted-foreground tabular-nums">
                  {coin.technique?.name}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2 text-sm">
                <span>Composition</span>
                <span className="text-muted-foreground tabular-nums">
                  <Tooltip>
                    <TooltipTrigger>{coin.composition.name}</TooltipTrigger>
                    <TooltipContent>
                      {coin.composition.description}
                    </TooltipContent>
                  </Tooltip>
                </span>
              </div>
            </div>
          </div>
          <Separator />
          <div className="-mt-4">
            <div className="flex items-center justify-between py-2 text-sm">
              <span>Edge</span>
              <span className="text-muted-foreground tabular-nums">
                {coin.edge?.name}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2 text-sm">
              <span>Rim</span>
              <span className="text-muted-foreground tabular-nums">
                {coin.rim?.name}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between py-2 text-sm">
              <span>{coin.mints.length > 1 ? "Mints" : "Mint"}</span>
              <span className="flex flex-col text-muted-foreground tabular-nums">
                {coin.mints.map((mint) => (
                  <span key={mint.code}>{mint.name}</span>
                ))}
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-semibold">Comments</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {coin.comments}
            </p>
          </div>

          <Separator />

          <div className="flex flex-col space-y-4">
            <p className="text-sm font-semibold">Themes</p>
            <div className="flex items-center gap-4 text-xs">
              {coin.themes.map((theme) => (
                <Link
                  key={theme.code}
                  to="/"
                  search={{ theme: theme.code }}
                  title={`Filter homepage by theme: ${theme.name}`}
                  aria-label={`Show homepage coins filtered by theme ${theme.name}`}
                >
                  <Badge
                    variant="outline"
                    className="text-[10px] tracking-wider uppercase"
                  >
                    {theme.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <aside className="w-full max-w-[20%]">
          <div className="flex flex-col gap-4">
            {coinSurfaces.length > 0 ? (
              coinSurfaces.map((surface) => (
                <ImageZoom key={surface.key}>
                  <img
                    src={getSurfaceImageUrl(surface)}
                    alt={`${coin.title} ${surface.label.toLowerCase()}`}
                    width="250"
                  />
                </ImageZoom>
              ))
            ) : (
              <ImageZoom>
                <img
                  src={getCoinPreviewImageUrl(coin.surfaces)}
                  alt={`${coin.title} placeholder`}
                  width="250"
                />
              </ImageZoom>
            )}
          </div>
        </aside>
      </section>
    </main>
  )
}
