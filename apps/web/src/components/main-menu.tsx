import { getCollectorRole } from "@/lib/collector-role"
import { Link, useLocation } from "@tanstack/react-router"
import { authClient, hasEditorAccess } from "@workspace/auth/client"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronDown, Database, LayoutDashboard, Settings } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { MouseEvent } from "react"
import { useEffect, useState } from "react"

type NavigationPath = "/" | "/database" | "/settings"

type NavigationItem = {
  to: NavigationPath
  label: string
  children?: NavigationChild[]
}

type NavigationChild = {
  to: NavigationPath
  label: string
}

const navigationIcons: Record<NavigationPath, LucideIcon> = {
  "/": LayoutDashboard,
  "/database": Database,
  "/settings": Settings,
}

const publicNavigationItems: NavigationItem[] = [
  {
    to: "/",
    label: "Overview",
  },
]

type NavigationChildItemProps = {
  child: NavigationChild
  isActive: boolean
  isVisible: boolean
  onSelect?: () => void
  index: number
}

function NavigationChildItem({
  child,
  isActive,
  isVisible,
  onSelect,
  index,
}: NavigationChildItemProps) {
  return (
    <Link
      to={child.to}
      preload="intent"
      onClick={() => onSelect?.()}
      className="group/child block"
    >
      <div className="relative">
        <div
          className={cn(
            "mr-[15px] ml-[35px] flex h-[32px] items-center",
            "border-l border-[#e6e6e6] pl-3 dark:border-[#1d1d1d]",
            "transition-opacity duration-200 ease-out",
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
          )}
          style={{
            transitionDelay: isVisible
              ? `${40 + index * 20}ms`
              : `${index * 20}ms`,
          }}
        >
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              "text-[#888] group-hover/child:text-primary",
              "overflow-hidden whitespace-nowrap",
              isActive && "text-primary"
            )}
          >
            {child.label}
          </span>
        </div>
      </div>
    </Link>
  )
}

type NavigationItemProps = {
  item: NavigationItem
  isActive: boolean
  isExpanded: boolean
  isItemExpanded: boolean
  onToggle: (to: NavigationPath) => void
  onSelect?: () => void
}

function NavigationItem({
  item,
  isActive,
  isExpanded,
  isItemExpanded,
  onToggle,
  onSelect,
}: NavigationItemProps) {
  const Icon = navigationIcons[item.to]
  const { pathname } = useLocation()
  const children = item.children ?? []
  const hasChildren = children.length > 0
  const shouldShowChildren = isExpanded && isItemExpanded

  const handleChevronClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle(item.to)
  }

  return (
    <div className="group">
      <div className="relative">
        <Link
          to={item.to}
          preload="intent"
          onClick={() => onSelect?.()}
          className="group/item block"
        >
          <div
            className={cn(
              "ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; mr-[15px] ml-[15px] h-[40px] border border-transparent transition-all duration-200",
              isActive &&
                "border-[#e6e6e6] bg-[#f7f7f7] dark:border-[#1d1d1d] dark:bg-[#131313]",
              isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]"
            )}
          />

          <div className="pointer-events-none absolute top-0 left-[15px] flex h-[40px] w-[40px] items-center justify-center text-black group-hover/item:!text-primary dark:text-[#666666]">
            <Icon size={20} className={cn(isActive && "dark:!text-white")} />
          </div>

          {isExpanded && (
            <div className="pointer-events-none absolute top-0 right-[4px] left-[55px] flex h-[40px] items-center">
              <span
                className={cn(
                  "text-sm font-medium text-[#666] transition-opacity duration-200 ease-in-out group-hover/item:text-primary",
                  "overflow-hidden whitespace-nowrap",
                  hasChildren ? "pr-2" : "",
                  isActive && "text-primary"
                )}
              >
                {item.label}
              </span>
            </div>
          )}
        </Link>

        {isExpanded && hasChildren && (
          <button
            type="button"
            aria-label={`${shouldShowChildren ? "Collapse" : "Expand"} ${item.label}`}
            aria-expanded={shouldShowChildren}
            onClick={handleChevronClick}
            className={cn(
              "absolute top-1 right-4 flex h-8 w-8 items-center justify-center transition-all duration-200",
              "text-[#888] hover:text-primary",
              isActive && "text-primary/60",
              shouldShowChildren && "rotate-180"
            )}
          >
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      {hasChildren && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            shouldShowChildren ? "mt-1 max-h-96" : "max-h-0"
          )}
        >
          {children.map((child, index) => {
            const isChildActive = pathname === child.to
            return (
              <NavigationChildItem
                key={child.to}
                child={child}
                isActive={isChildActive}
                isVisible={shouldShowChildren}
                onSelect={onSelect}
                index={index}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

type Props = {
  onSelect?: () => void
  isExpanded?: boolean
}

export function MainMenu({ onSelect, isExpanded = false }: Props) {
  const { pathname } = useLocation()
  const [expandedItem, setExpandedItem] = useState<NavigationPath | null>(null)
  const { data: session } = authClient.useSession()
  const navigationItems = getNavigationItems(session)

  useEffect(() => {
    setExpandedItem(null)
  }, [isExpanded])

  return (
    <div className="mt-4 w-full">
      <nav className="w-full">
        <div className="flex flex-col gap-2">
          {navigationItems.map((item) => {
            return (
              <NavigationItem
                key={item.to}
                item={item}
                isActive={isNavigationItemActive(item.to, pathname)}
                isExpanded={isExpanded}
                isItemExpanded={expandedItem === item.to}
                onToggle={(to) => {
                  setExpandedItem((current) => (current === to ? null : to))
                }}
                onSelect={onSelect}
              />
            )
          })}
        </div>
      </nav>
    </div>
  )
}

type CollectorSession = typeof authClient.$Infer.Session
type PrivateNavigationLink = {
  label: string
  to: Exclude<NavigationPath, "/">
}

const settingsNavigationLink: PrivateNavigationLink = {
  label: "Settings",
  to: "/settings",
}

const catalogueMaintenanceNavigationLink: PrivateNavigationLink = {
  label: "Database",
  to: "/database",
}

export function getPrivateNavigationLinks(
  session: CollectorSession | null
): PrivateNavigationLink[] {
  const role = getCollectorRole(session?.user ?? null)

  if (role === null) {
    return []
  }

  if (hasEditorAccess(role)) {
    return [catalogueMaintenanceNavigationLink, settingsNavigationLink]
  }

  return [settingsNavigationLink]
}

function getNavigationItems(
  session: CollectorSession | null
): NavigationItem[] {
  return [
    ...publicNavigationItems,
    ...getPrivateNavigationLinks(session).map(getPrivateNavigationItem),
  ]
}

function getPrivateNavigationItem(link: PrivateNavigationLink): NavigationItem {
  if (link.to === "/settings") {
    return {
      ...link,
      children: [{ to: "/settings", label: "General" }],
    }
  }

  return link
}

function isNavigationItemActive(to: NavigationPath, pathname: string) {
  if (to === "/") {
    return pathname === "/"
  }

  return pathname === to || pathname.startsWith(`${to}/`)
}
