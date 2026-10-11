import { useNavigate } from "@tanstack/react-router"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type { IssuerResponse } from "@workspace/api"

type IssuerSelectProps = {
  issuerCode?: string
  issuers: Array<IssuerResponse>
}

type IssuerOption = {
  label: string
  value: string
  disabled?: boolean
}

export function IssuerSelect({ issuerCode, issuers }: IssuerSelectProps) {
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
    <div className="flex w-full items-center gap-3">
      <Select
        name="issuer"
        items={items}
        value={issuerCode ?? ""}
        onValueChange={(issuer: string | null) => {
          void navigate({
            to: "/",
            search: issuer ? { issuer } : {},
          })
        }}
      >
        <SelectTrigger
          id="issuer-filter"
          aria-label="Issuer"
          className="w-full md:w-[calc(33.3vw-(--spacing(10)))] lg:w-[calc(25vw-(--spacing(10)))] xl:w-[calc(20vw-(--spacing(20)))] 2xl:w-[calc(16.7vw-(--spacing(20)))]"
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
    </div>
  )
}
