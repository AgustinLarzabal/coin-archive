import { Link } from "@tanstack/react-router"
import { buttonVariants } from "@workspace/ui/components/button"

export function AccessDenied() {
  return (
    <div className="my-auto flex w-full flex-1 items-center justify-center">
      <div className="w-full max-w-md px-4 text-center">
        <h2 className="mb-4">Access denied</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Only Editors and Admins can access catalogue maintenance.
        </p>

        <Link
          to="/"
          className={buttonVariants({ variant: "outline", className: "mt-6" })}
        >
          Home
        </Link>
      </div>
    </div>
  )
}
