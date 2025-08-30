import type { Venue, Hall, VenueDetailResponse, BookingRequest } from "@/types/venue"

export const venues: Venue[] = [
  {
    id: "v_1",
    name: "Grand Aurora Convention Center",
    address: "123 Skyline Ave",
    city: "Metropolis",
    description:
      "A premium venue for conferences, weddings, and concerts with flexible hall configurations and modern amenities.",
    images: ["/grand-hall-interior.png", "/banquet-setup.png", "/stage-and-lights.png"],
    rating: 4.7,
    priceRange: { min: 100, max: 450 },
  },
]

export const halls: Hall[] = [
  {
    id: "h_1",
    venueId: "v_1",
    name: "Emerald Hall",
    capacityMin: 50,
    capacityMax: 200,
    pricePerHour: 150,
    amenities: ["Stage", "Sound system", "Lighting"],
  },
  {
    id: "h_2",
    venueId: "v_1",
    name: "Sapphire Ballroom",
    capacityMin: 100,
    capacityMax: 400,
    pricePerHour: 300,
    amenities: ["Chandeliers", "Dance floor", "Catering area"],
  },
]

// key: `${hallId}:${YYYY-MM-DD}` => ["HH:MM-HH:MM"]
const bookingStore = new Map<string, string[]>()

export function getVenueDetail(id: string): VenueDetailResponse | null {
  const venue = venues.find((v) => v.id === id)
  if (!venue) return null
  const vhalls = halls.filter((h) => h.venueId === id)

  const availability: Record<string, string[]> = {}
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const daySlots = vhalls.flatMap((h) => bookingStore.get(`${h.id}:${iso}`) ?? [])
    availability[iso] = Array.from(new Set(daySlots))
  }
  return { venue, halls: vhalls, availability }
}

export function getHall(hallId: string) {
  return halls.find((h) => h.id === hallId)
}

export function getBookedSlots(hallId: string, date: string) {
  return bookingStore.get(`${hallId}:${date}`) ?? []
}

export function addBooking(req: BookingRequest, totalAmount: number) {
  const key = `${req.hallId}:${req.date}`
  const list = bookingStore.get(key) ?? []
  const entry = `${req.startTime}-${req.endTime}`
  bookingStore.set(key, [...list, entry])
  return { id: crypto.randomUUID(), status: "confirmed" as const, totalAmount }
}
