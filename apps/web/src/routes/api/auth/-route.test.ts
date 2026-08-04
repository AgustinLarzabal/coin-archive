import { describe, expect, it, vi } from "vitest"

describe("handleAuthRequest", () => {
  it("preserves the Web Crypto receiver when creating a request id", async () => {
    const randomUUID = vi
      .spyOn(crypto, "randomUUID")
      .mockImplementation(function (this: Crypto) {
        expect(this).toBe(crypto)

        return "00000000-0000-4000-8000-000000000000"
      })
    const { proxyAuthRequest } = await import("./$")

    const response = await proxyAuthRequest(
      new Request("https://archive.example.test/api/auth/get-session"),
      {
        apiBaseUrl: "https://api.example.test",
        allowSignInAttempt: async () => true,
        fetchApi: async () => Response.json(null),
      }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe(
      "00000000-0000-4000-8000-000000000000"
    )
    expect(randomUUID).toHaveBeenCalledOnce()
  })

  it("forwards auth transport and credentials to the shared API", async () => {
    const fetchApi = vi.fn(async (request: Request) => {
      expect(request.url).toBe(
        "https://api.example.test/api/auth/sign-in/social?return=1"
      )
      expect(request.method).toBe("POST")
      expect(request.redirect).toBe("manual")
      expect(request.headers.get("cookie")).toBe("session=collector-session")
      expect(request.headers.get("origin")).toBe("https://archive.example.test")
      expect(request.headers.get("x-forwarded-host")).toBe(
        "archive.example.test"
      )
      expect(request.headers.get("x-forwarded-proto")).toBe("https")
      expect(request.headers.get("x-forwarded-for")).toBe("203.0.113.9")
      expect(request.headers.get("x-request-id")).toBe("request-id")
      await expect(request.json()).resolves.toEqual({ provider: "google" })

      return new Response(null, {
        status: 302,
        headers: {
          Location: "https://accounts.google.com/o/oauth2/v2/auth",
          "Set-Cookie": "session=new-session; Path=/; HttpOnly; Secure",
        },
      })
    })
    const { proxyAuthRequest } = await import("./$")
    const request = new Request(
      "https://archive.example.test/api/auth/sign-in/social?return=1",
      {
        method: "POST",
        headers: {
          Cookie: "session=collector-session",
          Origin: "https://archive.example.test",
          "Content-Type": "application/json",
          "CF-Connecting-IP": "203.0.113.9",
          "X-Forwarded-For": "198.51.100.10",
          "X-Forwarded-Host": "attacker.example",
        },
        body: JSON.stringify({ provider: "google" }),
      }
    )

    const response = await proxyAuthRequest(request, {
      apiBaseUrl: "https://api.example.test",
      allowSignInAttempt: async () => true,
      createRequestId: () => "request-id",
      fetchApi,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth"
    )
    expect(response.headers.get("set-cookie")).toBe(
      "session=new-session; Path=/; HttpOnly; Secure"
    )
    expect(response.headers.get("x-request-id")).toBe("request-id")
    expect(fetchApi).toHaveBeenCalledTimes(1)
  })

  it("rejects cross-origin mutations without forwarding credentials", async () => {
    const fetchApi = vi.fn()
    const { proxyAuthRequest } = await import("./$")
    const response = await proxyAuthRequest(
      new Request("https://archive.example.test/api/auth/sign-out", {
        method: "POST",
        headers: {
          Cookie: "session=collector-session",
          Origin: "https://attacker.example",
        },
      }),
      {
        apiBaseUrl: "https://api.example.test",
        allowSignInAttempt: async () => true,
        createRequestId: () => "request-id",
        fetchApi,
      }
    )

    expect(response.status).toBe(403)
    expect(response.headers.get("x-request-id")).toBe("request-id")
    expect(fetchApi).not.toHaveBeenCalled()
  })

  it("rate limits sign-in attempts by originating browser IP", async () => {
    const fetchApi = vi.fn()
    const allowSignInAttempt = vi.fn(async () => false)
    const { proxyAuthRequest } = await import("./$")
    const response = await proxyAuthRequest(
      new Request("https://archive.example.test/api/auth/sign-in/social", {
        method: "POST",
        headers: {
          "CF-Connecting-IP": "203.0.113.9",
          Origin: "https://archive.example.test",
        },
      }),
      {
        apiBaseUrl: "https://api.example.test",
        allowSignInAttempt,
        createRequestId: () => "request-id",
        fetchApi,
      }
    )

    expect(response.status).toBe(429)
    expect(response.headers.get("retry-after")).toBe("60")
    expect(allowSignInAttempt).toHaveBeenCalledWith("203.0.113.9")
    expect(fetchApi).not.toHaveBeenCalled()
  })
})
