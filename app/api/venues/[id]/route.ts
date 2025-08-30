import { NextResponse, type NextRequest } from "next/server"
import { getSql } from "@/lib/db"
import type { AvailabilitySlot, VenueDetailResponse } from "@/types/venue"
import { rateLimit } from "@/lib/rate-limit"

function mockAvailability(days = 30): AvailabilitySlot[] {
  const out: AvailabilitySlot[] = []
  const start = new Date()
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const available = Math.random() > 0.2
    out.push({ date, available, conflicts: available ? [] : [{ startTime: "10:00", endTime: "12:00" }] })
  }
  return out
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.ip ?? "anon"
  const rl = rateLimit(`venues:${params.id}:${ip}`, 60, 15 * 60_000)
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const sql = getSql()
  try {
    if (sql) {
      const [venue] = await sql`
        SELECT id, name, address, city, description, rating, price_min, price_max
        FROM venues WHERE id = ${params.id}
      `
      const halls = await sql`
        SELECT id, venue_id as "venueId", name, capacity_min as "capacityMin",
               capacity_max as "capacityMax", price_per_hour as "pricePerHour", amenities
        FROM halls WHERE venue_id = ${params.id}
      `
      const images = await sql`SELECT url FROM venue_images WHERE venue_id = ${params.id} ORDER BY sort_order`
      const payload: VenueDetailResponse = {
        id: venue?.id ?? params.id,
        name: venue?.name ?? "Grand Aurora Convention Center",
        address: venue?.address ?? "123 Skyline Ave",
        city: venue?.city ?? "Metropolis",
        description: venue?.description ?? "A premium venue perfect for weddings and conferences.",
        images: (images as { url: string }[])?.map((i) => i.url) ?? [
          "/grand-hall-interior.png",
          "/banquet-setup.png",
          "/stage-and-lights.png",
        ],
        rating: Number(venue?.rating ?? 4.7),
        priceRange: { min: Number(venue?.price_min ?? 100), max: Number(venue?.price_max ?? 450) },
        halls: (halls as any[]) ?? [],
        availability: mockAvailability(),
      }
      return NextResponse.json(payload)
    }

    // Fallback without DB
    const payload: VenueDetailResponse = {
      id: params.id,
      name: "Grand Aurora Convention Center",
      address: "123 Skyline Ave",
      city: "Metropolis",
      description: "A premium venue perfect for weddings and conferences.",
      images: ["/grand-hall-interior.png", "/banquet-setup.png", "/stage-and-lights.png"],
      rating: 4.7,
      priceRange: { min: 100, max: 450 },
      halls: [
        {
          id: "h_1",
          venueId: params.id,
          name: "Emerald Hall",
          capacityMin: 50,
          capacityMax: 200,
          pricePerHour: 150,
          amenities: ["Stage", "Sound system", "Lighting"],
        },
        {
          id: "h_2",
          venueId: params.id,
          name: "Sapphire Ballroom",
          capacityMin: 100,
          capacityMax: 400,
          pricePerHour: 300,
          amenities: ["Chandeliers", "Dance floor", "Catering area"],
        },
      ],
      availability: mockAvailability(),
    }
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 })
  }
}
