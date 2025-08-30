const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

async function handle(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || "API Error")
  }
  return res.json()
}

export const apiClient = {
  get: async (endpoint: string) => handle(await fetch(`${API_BASE}${endpoint}`, { credentials: "include" })),
  post: async (endpoint: string, data: unknown) =>
    handle(
      await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }),
    ),
}
