import { jwtVerify } from "jose"

const secret = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null

export async function verifyBearer(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith("Bearer ") || !secret) return null
  const token = authHeader.slice(7)
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { sub?: string; role?: "customer" | "admin" }
  } catch {
    return null
  }
}
