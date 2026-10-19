import type {
  CoinSurfaceResponse,
  CoinSurfaceWithEngraversResponse,
} from "@coin-archive/api"

export function CoinSurfacePreview({
  coinTitle,
  surfaceName,
  surface,
  engravers,
}: {
  coinTitle: string
  surfaceName: "Obverse" | "Reverse" | "Edge"
  surface: CoinSurfaceResponse
  engravers?: CoinSurfaceWithEngraversResponse["engravers"]
}) {
  return (
    <div className="mx-auto max-w-xl px-3 py-4">
      <div className="mb-5 flex justify-center">
        {surface.imageUrl ? (
          <img
            src={surface.imageUrl}
            alt={`${surfaceName} of ${coinTitle}`}
            className="rounded-full"
          />
        ) : (
          <p className="font-mono text-sm text-muted-foreground">
            {surfaceName} image unavailable
          </p>
        )}
      </div>
      <div className="space-y-4 text-pretty">
        <p className="font-mono text-muted-foreground">
          {surface.description ?? `${surfaceName} description unavailable`}
        </p>
        {engravers && engravers.length > 0 && (
          <div>
            <h3 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              {engravers.length === 1 ? "Engraver" : "Engravers"}
            </h3>
            <ol className="mt-2 space-y-1 font-mono">
              {engravers.map((engraver) => (
                <li key={engraver.slug}>{engraver.fullName}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
