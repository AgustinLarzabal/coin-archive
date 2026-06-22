import type { OAuthProvider } from "@workspace/auth/client"
import { Button } from "@workspace/ui/components/button"
import { Icons } from "./icons"

const providerConfig: Record<
  OAuthProvider,
  { label: string; icon: (typeof Icons)[keyof typeof Icons] }
> = {
  google: { label: "Continue with Google", icon: Icons.Google },
}

export function OAuthSignIn({
  providers,
  onProviderClick,
}: {
  providers: OAuthProvider[]
  onProviderClick: (provider: OAuthProvider) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => {
        const { label, icon: Icon } = providerConfig[provider]
        return (
          <Button
            key={provider}
            variant="outline"
            className="w-full gap-2"
            onClick={() => onProviderClick(provider)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Button>
        )
      })}
    </div>
  )
}
