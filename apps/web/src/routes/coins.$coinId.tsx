import { getCoin } from "@workspace/db"
import type { CoinDetailRecord } from "@workspace/db"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Fragment } from "react"
import { z } from "zod"
import { ImageZoom } from "@workspace/ui/components/kibo-ui/image-zoom"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Badge } from "@workspace/ui/components/badge"

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

export const Route = createFileRoute("/coins/$coinId")({
  loader: ({ params }) => getCoinData({ data: params }),
  component: CoinRoute,
})

type CoinDetailPageProps = {
  coin: CoinDetailRecord
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

function hasSurfaceMedia(surface: CoinDetailSurfaceView) {
  return (surface.imageUrl ?? surface.thumbnailUrl) !== null
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

    if (hasSurfaceMedia(mappedSurface)) {
      mappedSurfaces.push(mappedSurface)
    }
  }

  return mappedSurfaces
}

function CoinRoute() {
  const { coin } = Route.useLoaderData()

  return <CoinDetailPage coin={coin} />
}

export function CoinDetailPage({ coin }: CoinDetailPageProps) {
  const coinSurfaces = mapCoinSurfaces(coin)
  const hasSingleYear = coin.minYear === coin.maxYear

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6 pt-20">
      <h1 className="max-w-[60%] text-2xl">{coin.title}</h1>

      <section className="flex justify-between gap-10">
        <div className="w-full max-w-[60%] space-y-4">
          <div className="flex items-center gap-4">
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
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {coin.rulers.map((ruler) => (
                <Fragment key={ruler.code}>{ruler.name}</Fragment>
              ))}
            </div>
            <span className="text-muted-foreground">•</span>
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
          </div>

          <Separator />

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link
              to="/"
              search={{ distribution: coin.distribution.code }}
              className="underline-offset-4 hover:underline"
              title={`Filter homepage by distribution: ${coin.distribution.name}`}
              aria-label={`Show homepage coins filtered by distribution ${coin.distribution.name}`}
            >
              {coin.distribution.name}
            </Link>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              {hasSingleYear ? "Year:" : "Years:"}
              <Badge variant="outline" className="tracking-wider uppercase">
                {coin.minYear}
              </Badge>
              {hasSingleYear ? null : (
                <>
                  -
                  <Badge variant="outline" className="tracking-wider uppercase">
                    {coin.maxYear}
                  </Badge>
                </>
              )}
            </div>
            {/* {coin.isDemonetized && ( */}
            <Badge
              variant="secondary"
              className="ml-auto text-[10px] tracking-wider uppercase"
            >
              Demonetized
            </Badge>
            {/* )} */}
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
                      {engraver.name}
                    </span>
                  </p>
                ))}
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex gap-10">
            <div className="max-w-[50%] flex-1">
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
            </div>
            <div className="max-w-[50%] flex-1">
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
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-sm font-semibold">Comments</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {coin.comments}
            </p>
          </div>
        </div>
        <aside className="w-full max-w-[20%]">
          <div className="flex flex-col gap-4">
            {coinSurfaces.map((surface) => (
              <ImageZoom key={surface.key}>
                <img
                  src={surface.imageUrl ?? surface.thumbnailUrl ?? undefined}
                  alt={`${coin.title} ${surface.label.toLowerCase()}`}
                  width="250"
                />
              </ImageZoom>
            ))}
          </div>
        </aside>
      </section>
    </main>
  )
}
