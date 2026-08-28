import { Icons } from "@/components/icons"
import type { DatabaseMaintenanceOverview } from "@coin-archive/api"
import type { LucideIcon } from "lucide-react"

type DatabaseMaintenanceSection = {
  to: string
  label: string
  countKey: keyof DatabaseMaintenanceOverview
  icon: LucideIcon
}

type DatabaseSecondaryMenuItem = Pick<
  DatabaseMaintenanceSection,
  "to" | "label"
>

export const databaseMaintenanceSections = [
  {
    to: "/database/coins",
    label: "Coins",
    countKey: "coins",
    icon: Icons.Coins,
  },
  {
    to: "/database/catalogues",
    label: "Catalogues",
    countKey: "catalogues",
    icon: Icons.BookImage,
  },
  {
    to: "/database/compositions",
    label: "Compositions",
    countKey: "compositions",
    icon: Icons.Component,
  },
  {
    to: "/database/currencies",
    label: "Currencies",
    countKey: "currencies",
    icon: Icons.CircleDollarSign,
  },
  {
    to: "/database/distributions",
    label: "Distributions",
    countKey: "distributions",
    icon: Icons.CircleDotDashed,
  },
  {
    to: "/database/edges",
    label: "Edges",
    countKey: "edges",
    icon: Icons.Circle,
  },
  {
    to: "/database/rims",
    label: "Rims",
    countKey: "rims",
    icon: Icons.CircleDashed,
  },
  {
    to: "/database/shapes",
    label: "Shapes",
    countKey: "shapes",
    icon: Icons.Hexagon,
  },
  {
    to: "/database/minting-techniques",
    label: "Minting Techniques",
    countKey: "mintingTechniques",
    icon: Icons.Anvil,
  },
  {
    to: "/database/engravers",
    label: "Engravers",
    countKey: "engravers",
    icon: Icons.PencilRuler,
  },
  {
    to: "/database/themes",
    label: "Themes",
    countKey: "themes",
    icon: Icons.FerrisWheel,
  },
  {
    to: "/database/issuers",
    label: "Issuers",
    countKey: "issuers",
    icon: Icons.Flag,
  },
  {
    to: "/database/rulers",
    label: "Rulers",
    countKey: "rulers",
    icon: Icons.Crown,
  },
  {
    to: "/database/ruler-groups",
    label: "Ruler Groups",
    countKey: "rulerGroups",
    icon: Icons.ChessQueen,
  },
  {
    to: "/database/orientations",
    label: "Orientations",
    countKey: "orientations",
    icon: Icons.CircleArrowDown,
  },
  {
    to: "/database/mints",
    label: "Mints",
    countKey: "mints",
    icon: Icons.Factory,
  },
] as const satisfies readonly DatabaseMaintenanceSection[]

export const databaseSecondaryMenuItems = [
  {
    to: "/database",
    label: "Overview",
  },
  ...databaseMaintenanceSections.map(({ to, label }) => ({ to, label })),
] as const satisfies readonly DatabaseSecondaryMenuItem[]
