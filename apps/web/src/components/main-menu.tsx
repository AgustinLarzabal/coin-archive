import { Link, useLocation } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Icons } from "./icons"
import { cn } from "@workspace/ui/lib/utils"
import { getCollectorRole } from "@/lib/collector-role"
import { authClient, hasEditorAccess } from "@workspace/auth/client"

const icons = {
  "/": () => <Icons.Overview size={20} />,
  "/database": () => <Icons.Database size={20} />,
  "/settings": () => <Icons.Settings size={20} />,
} as const
type CollectorSession = typeof authClient.$Infer.Session
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

type PrivateNavigationLink = {
  label: string
  to: Exclude<NavigationPath, "/">
}

const publicNavigationItems: NavigationItem[] = [
  {
    to: "/",
    label: "Overview",
  },
]

const catalogueMaintenanceNavigationLink: PrivateNavigationLink = {
  label: "Database",
  to: "/database",
}

const settingsNavigationLink: PrivateNavigationLink = {
  label: "Settings",
  to: "/settings",
}

type Props = {
  onSelect?: () => void
  isExpanded?: boolean
}

export function MainMenu({ onSelect, isExpanded = false }: Props) {
  const { pathname } = useLocation()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const { data: session } = authClient.useSession()
  const navigationItems = getNavigationItems(session)

  // Reset expanded item when sidebar expands/collapses
  useEffect(() => {
    setExpandedItem(null)
  }, [isExpanded])

  return (
    <div className="mt-4 w-full">
      <nav className="w-full">
        <div className="flex flex-col gap-2">
          {navigationItems.map((item) => {
            return (
              <Item
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

interface ItemProps {
  item: NavigationItem
  isActive: boolean
  isExpanded: boolean
  isItemExpanded: boolean
  onToggle: (path: string) => void
  onSelect?: () => void
}

const Item = ({
  item,
  isActive,
  isExpanded,
  isItemExpanded,
  onToggle,
  onSelect,
}: ItemProps) => {
  const Icon = icons[item.to]
  const { pathname } = useLocation()
  const hasChildren = item.children && item.children.length > 0

  // Children should be visible when: expanded sidebar AND this item is expanded
  const shouldShowChildren = isExpanded && isItemExpanded

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggle(item.to)
  }

  return (
    <div className="group">
      <Link
        to={item.to}
        preload="intent"
        onClick={() => onSelect?.()}
        className="group"
      >
        <div className="relative">
          {/* Background that expands */}
          <div
            className={cn(
              "ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; mr-[15px] ml-[15px] h-[40px] border border-transparent transition-all duration-200",
              isActive &&
                "border-[#e6e6e6] bg-[#f7f7f7] dark:border-[#1d1d1d] dark:bg-[#131313]",
              isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]"
            )}
          />

          {/* Icon - always in same position from sidebar edge */}
          <div className="pointer-events-none absolute top-0 left-[15px] flex h-[40px] w-[40px] items-center justify-center text-black group-hover:!text-primary dark:text-[#666666]">
            <div className={cn(isActive && "dark:!text-white")}>
              <Icon />
            </div>
          </div>

          {isExpanded && (
            <div className="pointer-events-none absolute top-0 right-[4px] left-[55px] flex h-[40px] items-center">
              <span
                className={cn(
                  "text-sm font-medium text-[#666] transition-opacity duration-200 ease-in-out group-hover:text-primary",
                  "overflow-hidden whitespace-nowrap",
                  hasChildren ? "pr-2" : "",
                  isActive && "text-primary"
                )}
              >
                {item.label}
              </span>
              {hasChildren && (
                <button
                  type="button"
                  onClick={handleChevronClick}
                  className={cn(
                    "mr-3 ml-auto flex h-8 w-8 items-center justify-center transition-all duration-200",
                    "pointer-events-auto text-[#888] hover:text-primary",
                    isActive && "text-primary/60",
                    shouldShowChildren && "rotate-180"
                  )}
                >
                  <Icons.ChevronDown size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Children */}
      {hasChildren && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            shouldShowChildren ? "mt-1 max-h-96" : "max-h-0"
          )}
        >
          {item.children!.map((child, index) => {
            const isChildActive = pathname === child.to
            return (
              <ChildItem
                key={child.to}
                child={child}
                isActive={isChildActive}
                isExpanded={isExpanded}
                shouldShow={shouldShowChildren}
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

const ChildItem = ({
  child,
  isActive,
  isExpanded,
  shouldShow,
  onSelect,
  index,
}: {
  child: NavigationChild
  isActive: boolean
  isExpanded: boolean
  shouldShow: boolean
  onSelect?: () => void
  index: number
}) => {
  const showChild = isExpanded && shouldShow

  return (
    <Link
      to={child.to}
      preload="intent"
      onClick={() => onSelect?.()}
      className="group/child block"
    >
      <div className="relative">
        {/* Child item text */}
        <div
          className={cn(
            "mr-[15px] ml-[35px] flex h-[32px] items-center",
            "border-l border-[#e6e6e6] pl-3 dark:border-[#1d1d1d]",
            "transition-all duration-200 ease-out",
            showChild ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
          )}
          style={{
            transitionDelay: showChild
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

function getNavigationItems(
  session: CollectorSession | null
): NavigationItem[] {
  return [
    ...publicNavigationItems,
    ...getPrivateNavigationLinks(session).map(getPrivateNavigationItem),
  ]
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
