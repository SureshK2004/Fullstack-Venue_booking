import { NextResponse, type NextRequest } from "next/server"
import { bookingSchema } from "@/app/api/_utils/validation"
import { overlaps, durationHours } from "@/app/api/_utils/time"
import { getSql } from "@/lib/db"
import { verifyBearer } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import crypto from "crypto"

function totalPrice(hours: number, pricePerHour: number, guestCount: number) {
  return Math.round((hours * pricePerHour + guestCount * 1.5) * 100) / 100
}

export async function POST(req: NextRequest) {
  const ip = req.ip ?? "anon"
  const rl = rateLimit(`book:${ip}`, 20, 60 * 60_000)
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { venueId, hallId, date, startTime, endTime, guestCount, customerDetails } = parsed.data
  const authUser = await verifyBearer(req.headers.get("authorization") ?? undefined).catch(() => null)
  const sql = getSql()
  try {
    let pricePerHour = 150
    if (sql) {
      const bookings = await sql`
        SELECT start_time, end_time FROM bookings
        WHERE hall_id = ${hallId} AND event_date = ${date}
      `
      if ((bookings as any[]).some((b) => overlaps(startTime, endTime, b.start_time, b.end_time))) {
        return NextResponse.json({ error: "Time conflicts with existing booking" }, { status: 409 })
      }
      const [hall] = await sql`SELECT price_per_hour FROM halls WHERE id = ${hallId}`
      pricePerHour = Number(hall?.price_per_hour ?? pricePerHour)
      const total = totalPrice(durationHours(startTime, endTime), pricePerHour, guestCount)

      const id = crypto.randomUUID()
      const [inserted] = await sql`
        INSERT INTO bookings (id, venue_id, hall_id, customer_name, customer_phone, customer_email, event_date, start_time, end_time, guest_count, total_amount, status)
        VALUES (${id}, ${venueId}, ${hallId}, ${customerDetails.name}, ${customerDetails.phone}, ${customerDetails.email}, ${date}, ${startTime}, ${endTime}, ${guestCount}, ${total}, 'confirmed')
        RETURNING id, status, total_amount
      `
      return NextResponse.json({
        id: inserted.id,
        status: inserted.status,
        totalAmount: Number(inserted.total_amount),
        user: authUser?.sub ?? "guest",
      })
    }

    // mock confirmation
    const total = totalPrice(durationHours(startTime, endTime), pricePerHour, guestCount)
    return NextResponse.json({
      id: crypto.randomUUID(),
      status: "confirmed",
      totalAmount: total,
      user: authUser?.sub ?? "guest",
      note: "Mock booking (set DATABASE_URL to persist)",
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 })
  }
}
