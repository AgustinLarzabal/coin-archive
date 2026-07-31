import { isValidElement } from "react"
import type { ReactElement, ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { EMPTY_COIN_DRAFT } from "../coin-form.shared"
import { IdentityClassificationSection } from "./identity-classification-section"

const options = {
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

type NamedControlProps = {
  children?: ReactNode
  name?: string
  onChange?: (event: { target: { value: string } }) => void
}

function findNamedControl(
  node: ReactNode,
  name: string
): ReactElement<NamedControlProps> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const control = findNamedControl(child, name)
      if (control) return control
    }
    return null
  }

  if (!isValidElement(node)) return null

  const element = node as ReactElement<NamedControlProps>
  if (element.props.name === name) return element

  return findNamedControl(element.props.children, name)
}

function createSection(
  updateDraft: ReturnType<typeof vi.fn>,
  compositionDescription: string
) {
  return IdentityClassificationSection({
    draft: {
      ...EMPTY_COIN_DRAFT,
      compositionDescription,
    },
    fieldErrors: {},
    idPrefix: "coin-edit",
    options,
    replaceRulers: vi.fn(),
    rulerErrors: [],
    updateDraft,
  })
}

describe("IdentityClassificationSection", () => {
  it("renders the editable Coin-owned Composition Description", () => {
    const markup = renderToStaticMarkup(
      createSection(vi.fn(), "Outer ring: nickel-brass; core: copper-nickel.")
    )

    expect(markup).toContain("Composition Description")
    expect(markup).toContain('name="compositionDescription"')
    expect(markup).toContain("Outer ring: nickel-brass; core: copper-nickel.")
  })

  it("updates and clears Composition Description through the textarea", () => {
    const updateDraft = vi.fn()
    const section = createSection(updateDraft, "Original material detail.")
    const textarea = findNamedControl(section, "compositionDescription")

    expect(textarea).not.toBeNull()

    textarea?.props.onChange?.({
      target: { value: "Revised material detail." },
    })
    textarea?.props.onChange?.({ target: { value: "" } })

    expect(updateDraft).toHaveBeenNthCalledWith(
      1,
      "compositionDescription",
      "Revised material detail."
    )
    expect(updateDraft).toHaveBeenNthCalledWith(2, "compositionDescription", "")
  })
})
