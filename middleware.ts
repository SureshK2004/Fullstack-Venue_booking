import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const headers: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v)
  if (req.nextUrl.pathname.startsWith("/api/")) {
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  }
  return res
}
