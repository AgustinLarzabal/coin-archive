import { Link } from "@tanstack/react-router"
import { isIsoIssuerCode } from "@workspace/api"
import { Flag } from "@workspace/ui/components/flags/flag"
import { cn } from "@workspace/ui/lib/utils"
import type { CoinListItemResponse } from "@workspace/api"
import type { ComponentProps } from "react"

import { formatIssuePeriod } from "@/features/issue-period"

type ExploreCoinProps = Omit<ComponentProps<"a">, "children" | "href"> & {
  coin: CoinListItemResponse
}

export function ExploreCoin({ className, coin, ...props }: ExploreCoinProps) {
  const image = coin.obverseImageUrl
    ? { surface: "Obverse", url: coin.obverseImageUrl }
    : coin.reverseImageUrl
      ? { surface: "Reverse", url: coin.reverseImageUrl }
      : null

  return (
    <Link
      to="/coins/$coinId"
      params={{ coinId: coin.id }}
      aria-label={coin.title}
      className={cn(
        "group relative flex aspect-square animate-fade-in flex-col items-center justify-center border-r border-b p-5 transition-colors hover:bg-sidebar max-md:nth-[2n]:border-r-0 md:max-lg:nth-[3n]:border-r-0 lg:max-xl:nth-[4n]:border-r-0 xl:max-2xl:nth-[5n]:border-r-0 2xl:nth-[6n]:border-r-0",
        className
      )}
      {...props}
    >
      {isIsoIssuerCode(coin.issuer.code) ? (
        <span className="absolute inset-s-5 top-5 flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground">
          <Flag code={coin.issuer.code} width={16} decorative />
          {coin.issuer.name}
        </span>
      ) : (
        <span className="absolute inset-s-5 top-5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {coin.issuer.name}
        </span>
      )}
      <span className="absolute inset-e-5 top-5 -translate-y-1.5 font-mono text-xs tracking-wider text-muted-foreground opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        KM# 1234
      </span>
      {image ? (
        <img
          src={image.url}
          alt={`${image.surface} of ${coin.title}`}
          className="w-1/2 rounded-full grayscale group-hover:grayscale-0"
        />
      ) : (
        <span className="font-mono text-xs text-muted-foreground">
          Image unavailable
        </span>
      )}
      <span className="absolute right-5 bottom-4 left-5 flex flex-col items-center gap-0.5 text-center font-mono text-xs tracking-wider text-balance text-muted-foreground">
        <span className="h-[2lh]">{coin.title}</span>
        <span>
          {formatIssuePeriod(coin.firstIssueYear, coin.lastIssueYear)}
        </span>
      </span>
    </Link>
  )
}
