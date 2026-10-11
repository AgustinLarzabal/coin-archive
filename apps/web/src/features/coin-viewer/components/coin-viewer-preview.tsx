import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import type {
  CoinDetailResponse,
  CoinSurfaceResponse,
  CoinSurfaceWithEngraversResponse,
} from "@workspace/api"

function CoinSurfacePreview({
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
    <div className="px-7 py-5">
      <div className="mb-5 flex justify-center">
        {surface.imageUrl ? (
          <img src={surface.imageUrl} alt={`${surfaceName} of ${coinTitle}`} />
        ) : (
          <p className="font-mono text-sm text-muted-foreground">
            {surfaceName} image unavailable
          </p>
        )}
      </div>
      <div className="space-y-4 text-pretty lg:p-10">
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

export function CoinViewerPreview({ coin }: { coin: CoinDetailResponse }) {
  const hasEdgeCatalogueData = Boolean(
    coin.edge.description || coin.edge.imageUrl
  )

  return (
    <div className="flex-1">
      <Tabs defaultValue="obverse" className="w-full">
        <div className="px-3 pt-5 pb-1 lg:p-0">
          <TabsList variant="responsive" className="w-full">
            <TabsTrigger value="obverse" className="font-mono uppercase">
              Obverse
            </TabsTrigger>
            <TabsTrigger value="reverse" className="font-mono uppercase">
              Reverse
            </TabsTrigger>
            {hasEdgeCatalogueData && (
              <TabsTrigger value="edge" className="font-mono uppercase">
                Edge
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        <TabsContent value="obverse">
          <ScrollArea className="h-[calc(100vh-72px-43px-52px-40px)] lg:h-[calc(100vh-72px-40px-44px)]">
            <CoinSurfacePreview
              coinTitle={coin.title}
              surfaceName="Obverse"
              surface={coin.obverse}
              engravers={coin.obverse.engravers}
            />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="reverse">
          <ScrollArea className="h-[calc(100vh-72px-43px-52px-40px)] lg:h-[calc(100vh-72px-40px-44px)]">
            <CoinSurfacePreview
              coinTitle={coin.title}
              surfaceName="Reverse"
              surface={coin.reverse}
              engravers={coin.reverse.engravers}
            />
          </ScrollArea>
        </TabsContent>
        {hasEdgeCatalogueData && (
          <TabsContent value="edge">
            <ScrollArea className="h-[calc(100vh-72px-43px-52px-40px)] lg:h-[calc(100vh-72px-40px-44px)]">
              <CoinSurfacePreview
                coinTitle={coin.title}
                surfaceName="Edge"
                surface={coin.edge}
              />
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
