import { isValidElement } from "react"
import type { ReactElement, ReactNode } from "react"
import {
  getCollectorIdentityLabel,
  getLoginRedirectTarget,
  SiteHeaderContent,
} from "./site-header"
import type * as TanstackReactRouter from "@tanstack/react-router"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackReactRouter>()

  return {
    ...actual,
    Link: ({
      children,
      search,
      to = "",
      ...props
    }: React.ComponentPropsWithoutRef<"a"> & {
      search?: Record<string, string>
      to?: string
    }) => {
      const href =
        search?.redirect === undefined
          ? to
          : `${to}?redirect=${encodeURIComponent(search.redirect)}`

      return (
        <a href={href} {...props}>
          {children}
        </a>
      )
    },
  }
})

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement) => boolean
): ReactElement | null {
  if (node === null || node === undefined || typeof node === "boolean") {
    return null
  }

  if (typeof node === "string" || typeof node === "number") {
    return null
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const result = findElement(child, predicate)

      if (result !== null) {
        return result
      }
    }

    return null
  }

  if (typeof node === "bigint" || !isValidElement(node)) {
    return null
  }

  const elementNode = node as ReactElement<{ children?: ReactNode }>

  if (predicate(elementNode)) {
    return elementNode
  }

  return findElement(elementNode.props.children, predicate)
}

describe("SiteHeaderContent", () => {
  it("shows a sign-in path to signed-out visitors", () => {
    const markup = renderToStaticMarkup(
      <SiteHeaderContent loginRedirectTarget="/coins/coin-1" session={null} />
    )

    expect(markup).toContain("Coin Archive")
    expect(markup).toContain("Sign in")
    expect(markup).toContain("/login?redirect=%2Fcoins%2Fcoin-1")
    expect(markup).not.toContain("Sign out")
  })

  it("shows Collector identity and sign-out when a session is active", () => {
    const markup = renderToStaticMarkup(
      <SiteHeaderContent
        loginRedirectTarget="/"
        session={{
          session: {
            id: "session-1",
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: "collector-1",
            expiresAt: new Date(),
            token: "token-1",
            ipAddress: null,
            userAgent: null,
          },
          user: {
            id: "collector-1",
            name: "Ada Lovelace",
            email: "ada@example.com",
            emailVerified: true,
            image: null,
            role: "collector",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }}
      />
    )

    expect(markup).toContain("Ada Lovelace")
    expect(markup).toContain("Sign out")
    expect(markup).not.toContain("Sign in")
  })

  it("wires the sign-out action from the header button", async () => {
    const onSignOut = vi.fn(async () => {})
    const element = SiteHeaderContent({
      loginRedirectTarget: "/",
      onSignOut,
      session: {
        session: {
          id: "session-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "collector-1",
          expiresAt: new Date(),
          token: "token-1",
          ipAddress: null,
          userAgent: null,
        },
        user: {
          id: "collector-1",
          name: "",
          email: "collector@example.com",
          emailVerified: true,
          image: null,
          role: "collector",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    })
    const button = findElement(
      element,
      (candidate) => candidate.type === "button"
    )

    expect(button).not.toBeNull()

    await (button?.props as { onClick: () => Promise<void> | void }).onClick()

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})

describe("getCollectorIdentityLabel", () => {
  it("prefers the Collector name and falls back to email", () => {
    expect(
      getCollectorIdentityLabel({
        email: "ada@example.com",
        name: "Ada Lovelace",
      })
    ).toBe("Ada Lovelace")

    expect(
      getCollectorIdentityLabel({
        email: "collector@example.com",
        name: "   ",
      })
    ).toBe("collector@example.com")
  })
})

describe("getLoginRedirectTarget", () => {
  it("preserves the current in-app location for later return", () => {
    expect(
      getLoginRedirectTarget({
        hash: "#details",
        pathname: "/coins/coin-1",
        searchStr: "?issuer=spain",
      })
    ).toBe("/coins/coin-1?issuer=spain#details")
  })
})
