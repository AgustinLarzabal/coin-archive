import { Badge } from "@coin-archive/ui/components/badge"
import { Flag } from "@coin-archive/ui/components/flags/flag"
import { Separator } from "@coin-archive/ui/components/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@coin-archive/ui/components/tooltip"
import { Link } from "@tanstack/react-router"
import { isIsoIssuerCode } from "../issuer"
import type { CoinDetailResponse } from "@coin-archive/api"

import { formatIssuePeriod } from "@/features/issue-period"

function groupRulingAuthorityAttributionsByConsecutiveRole(
  coin: CoinDetailResponse
) {
  return coin.rulers.reduce<
    Array<{ role: string; attributions: CoinDetailResponse["rulers"] }>
  >((groups, attribution) => {
    const currentGroup = groups.at(-1)
    if (currentGroup?.role === attribution.role) {
      currentGroup.attributions.push(attribution)
    } else {
      groups.push({ role: attribution.role, attributions: [attribution] })
    }
    return groups
  }, [])
}

export function CoinViewerDetails({ coin }: { coin: CoinDetailResponse }) {
  const attributionGroups =
    groupRulingAuthorityAttributionsByConsecutiveRole(coin)

  return (
    <aside className="flex-1 border-l bg-sidebar">
      <div className="mb-2 p-6 pb-3">
        <h2 className="mb-4 font-mono text-base">
          {coin.title}
          {coin.faceValue && ` · ${coin.faceValue.label}`}
        </h2>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {isIsoIssuerCode(coin.issuer.code) && (
              <Flag code={coin.issuer.code} width={16} decorative />
            )}
            <span>{coin.issuer.name}</span>
          </div>
          <span aria-hidden="true">·</span>
          <div>
            {attributionGroups.map((group, groupIndex) => (
              <div
                className="flex justify-between gap-1"
                key={`${group.role}-${groupIndex}`}
              >
                {/* <div className="text-muted-foreground">{group.role}:</div> */}
                <div className="text-right">
                  {group.attributions.map((attribution, attributionIndex) => (
                    <div key={`${attribution.slug}-${attributionIndex}`}>
                      {attribution.name}
                      {attribution.tenure ? ` (${attribution.tenure})` : ""}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Separator className="mt-6 mb-4" />
        <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
          <Badge variant="outline">
            {formatIssuePeriod(coin.firstIssueYear, coin.lastIssueYear)}
          </Badge>
          <span aria-hidden="true">·</span>
          <div>{coin.distributionName}</div>
          {coin.demonetized === true && (
            <Badge variant="secondary" className="ml-auto">
              Demonetized
            </Badge>
          )}
        </div>
        <Separator className="mt-4 mb-6" />

        <div className="flex gap-10 border-b font-mono text-xs text-muted-foreground">
          <div className="flex-1">
            <ul>
              <li className="flex items-center justify-between border-b py-2">
                <span>Face Value</span>
                <span>{coin.faceValue && coin.faceValue.label}</span>
              </li>
              <li className="flex items-center justify-between border-b py-2">
                <span>Size</span>
                <span>{coin.size} mm</span>
              </li>
              <li className="flex items-center justify-between border-b py-2">
                <span>Weight</span>
                <span>{coin.weight} gr</span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span>Thickness</span>
                <span>{coin.thickness} mm</span>
              </li>
            </ul>
          </div>
          <div className="flex-1">
            <ul>
              <li className="flex items-center justify-between border-b py-2">
                <span>Currency</span>
                <span>
                  {coin.faceValue && coin.faceValue.currency.fullName}
                </span>
              </li>
              <li className="flex items-center justify-between border-b py-2">
                <span>Composition</span>
                <Tooltip>
                  <TooltipTrigger
                    render={<span>{coin.compositionName}</span>}
                  />
                  <TooltipContent>
                    <p>{coin.compositionDetail}</p>
                  </TooltipContent>
                </Tooltip>
              </li>
              <li className="flex items-center justify-between py-2">
                <span>Orientation</span>
                <span>{coin.orientation}</span>
              </li>
              <li className="flex items-center justify-between border-b py-2">
                <span>Shape</span>
                <span>{coin.shapeName}</span>
              </li>
              <li className="flex items-center justify-between border-b py-2">
                <span>Technique</span>
                <span>{coin.techniqueName}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 font-mono text-xs text-muted-foreground">
          <span>Mint</span>
          <span>
            {coin.mints.map((mint) => (
              <div key={mint.slug}>
                {mint.name}, {mint.place}, {mint.country.name}
              </div>
            ))}
          </span>
        </div>

        <div className="mt-10 space-y-4 font-mono text-xs/5">
          <p className="mb-6 tracking-widest uppercase">Comments</p>
          <p className="text-muted-foreground">
            Common 2 Euro commemorative coin issued by all member countries of
            the Eurozone.
          </p>
          <p className="text-muted-foreground">
            The flag of Europe or European flag consists of twelve golden stars
            forming a circle on a blue field. It is the official flag of the
            European Union. It was designed and adopted in 1955 by the Council
            of Europe (CoE) as a symbol for the whole of Europe.
          </p>
        </div>

        <div className="mt-10 flex items-center gap-4 text-[10px] uppercase">
          {coin.tags.map((tag) => (
            <div key={tag.slug}>
              <Link to="/" search={{ tag: tag.slug }}>
                <Badge variant="secondary" className="text-xs">
                  # {tag.name}
                </Badge>
              </Link>
            </div>
          ))}
        </div>

        {/* <dl className="mt-6 font-mono text-xs"> */}
        {/* {coin.orientation !== null && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Coin Orientation</dt>
              <dd>{coin.orientation}</dd>
            </div>
          )} */}
        {/* {coin.shapeName !== null && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Coin Shape</dt>
              <dd>{coin.shapeName}</dd>
            </div>
          )} */}
        {/* {coin.techniqueName !== null && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Coin Technique</dt>
              <dd>{coin.techniqueName}</dd>
            </div>
          )} */}
        {/* {coin.compositionName !== null && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Coin Composition</dt>
              <dd>{coin.compositionName}</dd>
            </div>
          )} */}
        {/* {coin.compositionDetail !== null && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Coin Composition Detail</dt>
              <dd>{coin.compositionDetail}</dd>
            </div>
          )} */}
        {/* {coin.size !== null && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Coin Size</dt>
              <dd>{coin.size} mm</dd>
            </div>
          )} */}
        {/* {coin.thickness !== null && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Coin Thickness</dt>
              <dd>{coin.thickness} mm</dd>
            </div>
          )} */}
        {/* {coin.weight !== null && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Coin Weight</dt>
              <dd>{coin.weight} g</dd>
            </div>
          )} */}
        {/* {coin.faceValue && (
            <>
              <div className="flex justify-between gap-4 border-t pt-3">
                <dt className="text-muted-foreground">Face Value</dt>
                <dd>{coin.faceValue.label}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3">
                <dt className="text-muted-foreground">Currency</dt>
                <dd>{coin.faceValue.currency.fullName}</dd>
              </div>
            </>
          )} */}
        {/* {attributionGroups.map((group, groupIndex) => (
            <div
              className="flex justify-between gap-4 border-t pt-3"
              key={`${group.role}-${groupIndex}`}
            >
              <dt className="text-muted-foreground">{group.role}</dt>
              <dd className="text-right">
                {group.attributions.map((attribution, attributionIndex) => (
                  <div key={`${attribution.slug}-${attributionIndex}`}>
                    {attribution.name}
                    {attribution.tenure ? ` (${attribution.tenure})` : ""}
                  </div>
                ))}
              </dd>
            </div>
          ))} */}
        {/* {coin.mints.length > 0 && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Mint</dt>
              <dd className="text-right">
                {coin.mints.map((mint) => (
                  <div key={mint.slug}>
                    {mint.name}
                    <div>
                      {mint.place}, {mint.country.name}
                    </div>
                  </div>
                ))}
              </dd>
            </div>
          )} */}
        {/* {coin.tags.length > 0 && (
            <div className="flex justify-between gap-4 border-t pt-3">
              <dt className="text-muted-foreground">Tags</dt>
              <dd className="text-right">
                {coin.tags.map((tag) => (
                  <div key={tag.slug}>
                    <Link to="/" search={{ tag: tag.slug }}>
                      {tag.name}
                    </Link>
                  </div>
                ))}
              </dd>
            </div>
          )} */}
        {/* </dl> */}
      </div>
    </aside>
  )
}
