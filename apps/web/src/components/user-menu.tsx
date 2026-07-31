import { useNavigate } from "@tanstack/react-router"
import { authClient, hasEditorAccess } from "@coin-archive/auth/client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@coin-archive/ui/components/avatar"
import { Button } from "@coin-archive/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@coin-archive/ui/components/dropdown-menu"
import { getCollectorRole } from "@/lib/collector-role"

export function UserMenu() {
  const { data: session } = authClient.useSession()
  const navigate = useNavigate()
  const collectorRole = getCollectorRole(session?.user ?? null)
  const canMaintainDatabase =
    collectorRole !== null && hasEditorAccess(collectorRole)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full p-0"
          >
            <Avatar>
              {session?.user.image && (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name}
                  className="grayscale"
                />
              )}
              <AvatarFallback>
                {session?.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />

      <DropdownMenuContent className="w-[240px]" sideOffset={10} align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="line-clamp-1 block max-w-[155px] truncate text-xs font-bold text-foreground">
              {session?.user.name}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {session?.user.email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {canMaintainDatabase && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => navigate({ to: "/database" })}
              >
                Database Maintenance
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-xs"
            onClick={() => navigate({ to: "/settings" })}
          >
            Account
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-xs"
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () =>
                  navigate({ to: "/login", search: { redirect: "/" } }),
              },
            })
          }
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
