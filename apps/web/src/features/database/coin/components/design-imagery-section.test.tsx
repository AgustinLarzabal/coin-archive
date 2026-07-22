import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { EMPTY_COIN_DRAFT } from "../coin-form.shared"
import { DesignImagerySection } from "./design-imagery-section"
import type { CoinFormOptions } from "../coin-form.shared"

const options: CoinFormOptions = {
  catalogues: [],
  compositions: [],
  currencies: [],
  distributions: [],
  edges: [],
  engravers: [],
  issuers: [],
  mints: [],
  orientations: [],
  rims: [],
  rulers: [],
  shapes: [],
  techniques: [],
  themes: [],
}

describe("DesignImagerySection", () => {
  it("shows each persisted Surface Image with independent replacement and removal controls", () => {
    const draft = structuredClone(EMPTY_COIN_DRAFT)
    draft.surfaces.obverse.imageUrl = "https://images.example.test/obverse.jpg"
    draft.surfaces.reverse.imageUrl = "https://images.example.test/reverse.jpg"
    draft.surfaces.edge.imageUrl = "https://images.example.test/edge.jpg"

    const markup = renderToStaticMarkup(
      <DesignImagerySection
        draft={draft}
        fieldErrors={{}}
        idPrefix="coin-edit"
        options={options}
        addFaceEngraver={vi.fn()}
        removeFaceEngraver={vi.fn()}
        updateEdgeSurface={vi.fn()}
        updateFaceEngraver={vi.fn()}
        updateFaceSurface={vi.fn()}
        onSurfaceImagePendingChange={vi.fn()}
        removePersistedSurfaceImage={vi.fn()}
        removeSurfaceImageUpload={vi.fn()}
        updateSurfaceImageUploadReference={vi.fn()}
        authorizeSurfaceImageUpload={vi.fn()}
      />
    )

    expect(markup).toContain('src="https://images.example.test/obverse.jpg"')
    expect(markup).toContain('src="https://images.example.test/reverse.jpg"')
    expect(markup).toContain('src="https://images.example.test/edge.jpg"')
    expect(markup.match(/Remove current Surface Image/g)).toHaveLength(3)
    expect(markup.match(/Drop a Surface Image here/g)).toHaveLength(3)
  })
})
