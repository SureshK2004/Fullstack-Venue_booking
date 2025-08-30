export interface Venue {
  id: string
  name: string
  address: string
  city: string
  description: string
  images: string[]
  rating: number
  priceRange: {
    min: number
    max: number
  }
}

export interface Hall {
  id: string
  venueId: string
  name: string
  capacityMin: number
  capacityMax: number
  pricePerHour: number
  amenities: string[]
}

export interface AvailabilitySlot {
  date: string
  available: boolean
  conflicts?: Array<{ startTime: string; endTime: string }>
}

export interface VenueDetailResponse extends Venue {
  halls: Hall[]
  availability: AvailabilitySlot[]
}

export interface CheckAvailabilityRequest {
  hallId: string
  date: string
  startTime: string
  endTime: string
}

export interface CheckAvailabilityResponse {
  available: boolean
  conflicts: Array<{ startTime: string; endTime: string }>
}

export interface BookingRequest {
  venueId: string
  hallId: string
  date: string
  startTime: string
  endTime: string
  guestCount: number
  customerDetails: { name: string; phone: string; email: string }
}

export interface BookingResponse {
  id: string
  status: "confirmed" | "pending"
  totalAmount: number
}
