import { describe, expect, it, vi } from "vitest"

describe("handleAuthRequest", () => {
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
      fetchApi,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth"
    )
    expect(response.headers.get("set-cookie")).toBe(
      "session=new-session; Path=/; HttpOnly; Secure"
    )
    expect(fetchApi).toHaveBeenCalledTimes(1)
  })
})
