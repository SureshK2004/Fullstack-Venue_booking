import { NextResponse, type NextRequest } from "next/server"
import { getSql } from "@/lib/db"
import { checkAvailabilitySchema } from "@/app/api/_utils/validation"
import { overlaps } from "@/app/api/_utils/time"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.ip ?? "anon"
  const rl = rateLimit(`avail:${params.id}:${ip}`, 100, 15 * 60_000)
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = checkAvailabilitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { hallId, date, startTime, endTime } = parsed.data
  const sql = getSql()
  try {
    if (sql) {
      const bookings = await sql`
        SELECT start_time, end_time FROM bookings
        WHERE hall_id = ${hallId} AND event_date = ${date}
      `
      const conflicts = (bookings as any[])
        .filter((b) => overlaps(startTime, endTime, b.start_time, b.end_time))
        .map((b) => ({ startTime: b.start_time, endTime: b.end_time }))
      return NextResponse.json({ available: conflicts.length === 0, conflicts })
    }

    // mock fallback
    const conflict = Math.random() < 0.2
    return NextResponse.json({
      available: !conflict,
      conflicts: conflict ? [{ startTime: "10:00", endTime: "12:00" }] : [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 })
  }
}
