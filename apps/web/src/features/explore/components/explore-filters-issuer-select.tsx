import { useNavigate } from "@tanstack/react-router"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { exploreFilterControlClassName } from "./explore-filter-styles"
import type { IssuerResponse } from "@workspace/api"

type IssuerSelectProps = {
  engraverSlug?: string
  issuerCode?: string
  issuers: Array<IssuerResponse>
}

type IssuerOption = {
  label: string
  value: string
  disabled?: boolean
}

export function IssuerSelect({
  engraverSlug,
  issuerCode,
  issuers,
}: IssuerSelectProps) {
  const navigate = useNavigate({ from: "/" })
  const unknownIssuerCode =
    issuerCode && !issuers.some((issuer) => issuer.code === issuerCode)
      ? issuerCode
      : undefined
  const items: Array<IssuerOption> = [
    { label: "All issuers", value: "" },
    ...issuers.map((issuer) => ({
      label: issuer.name,
      value: issuer.code,
    })),
    ...(unknownIssuerCode
      ? [
          {
            label: `Unknown issuer (${unknownIssuerCode})`,
            value: unknownIssuerCode,
            disabled: true,
          },
        ]
      : []),
  ]

  return (
    <Select
      name="issuer"
      items={items}
      value={issuerCode ?? ""}
      onValueChange={(issuer: string | null) => {
        void navigate({
          to: "/",
          search: {
            engraver: engraverSlug,
            issuer: issuer || undefined,
          },
        })
      }}
    >
      <SelectTrigger
        id="issuer-filter"
        aria-label="Issuer"
        className={exploreFilterControlClassName}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              disabled={item.disabled}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
