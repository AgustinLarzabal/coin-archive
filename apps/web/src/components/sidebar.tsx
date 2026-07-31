import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { cn } from "@coin-archive/ui/lib/utils"
import { Icons } from "./icons"
import { MainMenu } from "./main-menu"

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <aside
      className={cn(
        "desktop:overflow-hidden desktop:rounded-tl-[10px] desktop:rounded-bl-[10px] ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; fixed top-0 z-50 hidden h-screen flex-shrink-0 flex-col items-center justify-between pb-12 transition-all duration-200 md:flex",
        "border-r border-border bg-background",
        isExpanded ? "w-[240px]" : "w-[70px]"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div
        className={cn(
          "ease-&lsqb;cubic-bezier(0.4,0,0.2,1)&rsqb; absolute top-0 left-0 flex h-[70px] items-center justify-center border-b border-border bg-background transition-all duration-200",
          isExpanded ? "w-full" : "w-[69px]"
        )}
      >
        <Link to="/" className="absolute left-[20px] transition-none">
          <Icons.LogoSmall />
        </Link>
      </div>

      <div className="mb-3 flex w-full flex-1 flex-col border-b border-border pt-[70px]">
        <MainMenu isExpanded={isExpanded} />
      </div>
    </aside>
  )
}
