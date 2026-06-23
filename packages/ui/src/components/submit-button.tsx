import type { Button as ButtonPrimitive } from "@base-ui/react/button"
import { Button } from "./button"
import { Spinner } from "./spinner"
import { cn } from "../lib/utils"

export function SubmitButton({
  children,
  isSubmitting,
  disabled,
  ...props
}: {
  children: React.ReactNode
  isSubmitting: boolean
  disabled?: boolean
} & ButtonPrimitive.Props) {
  return (
    <Button variant="outline" size="icon" aria-label="Submit">
      <span className={cn(isSubmitting && "invisible")}>{children}</span>
      {isSubmitting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
    </Button>
  )
}
