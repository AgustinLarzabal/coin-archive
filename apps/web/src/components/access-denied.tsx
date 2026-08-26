import { Link } from "@tanstack/react-router"
import { buttonVariants } from "@coin-archive/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@coin-archive/ui/components/empty"
import { Icons } from "./icons"

export function AccessDenied() {
  return (
    <div className="my-auto flex w-full flex-1 items-center justify-center">
      <Empty className="min-h-[400px] w-full max-w-4xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia>
            <Icons.LogoSmall />
          </EmptyMedia>
          <EmptyTitle>Access denied</EmptyTitle>
          <EmptyDescription>
            Only Editors and Admins can access catalogue maintenance.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            to="/"
            className={buttonVariants({
              variant: "outline",
              className: "mt-6",
            })}
          >
            Home
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
