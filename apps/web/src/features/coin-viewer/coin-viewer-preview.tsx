import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { CoinSurfacePreview } from "./coin-surface-preview"
import type { CoinDetailResponse } from "@workspace/api"

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
