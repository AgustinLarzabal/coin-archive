import { Link, useLocation } from "@tanstack/react-router"
import { cn } from "@workspace/ui/lib/utils"

type Item = {
  to: string
  label: string
}

type Props = {
  items: Item[]
}

export function SecondaryMenu({ items }: Props) {
  const { pathname } = useLocation()

  return (
    <nav>
      <ul className="scrollbar-hide flex gap-6 overflow-auto pb-1 text-sm">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            preload="intent"
            className={cn(
              "text-muted-foreground",
              pathname === item.to &&
                "text-primary underline decoration-2 underline-offset-6"
            )}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </ul>
    </nav>
  )
}
