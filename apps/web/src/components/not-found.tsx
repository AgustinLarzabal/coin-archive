import { Button } from "@coin-archive/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@coin-archive/ui/components/empty"
import { Link } from "@tanstack/react-router"

export function NotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>404 - Page not found</EmptyTitle>
        <EmptyDescription>
          The page you&apos;re looking for doesn&apos;t exist.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" render={<Link to="/" />}>
          Home
        </Button>
      </EmptyContent>
    </Empty>
  )
}
