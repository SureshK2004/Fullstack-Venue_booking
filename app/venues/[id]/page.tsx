"use client"

import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiClient } from "@/services/api"
import type {
  VenueDetailResponse,
  Hall,
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
  BookingRequest,
  BookingResponse,
} from "@/types/venue"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function useVenue(id: string) {
  return useQuery<VenueDetailResponse>({
    queryKey: ["venue", id],
    queryFn: () => apiClient.get(`/venues/${id}`),
  })
}

function Gallery({ images }: { images: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {images.slice(0, 3).map((src, i) => (
        <img
          key={i}
          src={src || "/placeholder.svg?height=240&width=400&query=venue%20image"}
          alt={`Venue image ${i + 1}`}
          className="h-40 w-full object-cover rounded"
        />
      ))}
    </div>
  )
}

function AvailabilityGrid({ availability }: { availability: VenueDetailResponse["availability"] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
      {availability.slice(0, 14).map((slot) => (
        <div
          key={slot.date}
          className={`rounded border p-2 text-sm ${slot.available ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}
        >
          <div className="font-medium">{slot.date}</div>
          <div className="text-xs">{slot.available ? "Available" : "Unavailable"}</div>
        </div>
      ))}
    </div>
  )
}

function useCheckAvailability(venueId: string) {
  return useMutation<CheckAvailabilityResponse, Error, CheckAvailabilityRequest>({
    mutationFn: (payload) => apiClient.post(`/venues/${venueId}/check-availability`, payload),
  })
}

function useCreateBooking() {
  return useMutation<BookingResponse, Error, BookingRequest>({
    mutationFn: (payload) => apiClient.post(`/bookings`, payload),
  })
}

function BookingModal({ venueId, halls, defaultHallId }: { venueId: string; halls: Hall[]; defaultHallId?: string }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [hallId, setHallId] = useState(defaultHallId || halls[0]?.id)
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [guestCount, setGuestCount] = useState(50)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const checker = useCheckAvailability(venueId)
  const creator = useCreateBooking()

  const selectedHall = useMemo(() => halls.find((h) => h.id === hallId), [hallId, halls])
  const canStep1 = Boolean(hallId && date && startTime && endTime)
  const canStep2 = name.length >= 2 && phone.length >= 5 && /\S+@\S+\.\S+/.test(email) && guestCount > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setStep(1)}>
          Book Now
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Step 1: Select date & time"}
            {step === 2 && "Step 2: Guest details"}
            {step === 3 && "Step 3: Confirmation"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Hall</Label>
              <Select value={hallId} onValueChange={(v) => setHallId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select hall" />
                </SelectTrigger>
                <SelectContent>
                  {halls.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name} • {h.capacityMin}-{h.capacityMax} guests • ${h.pricePerHour}/hr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Guests</Label>
                <Input
                  type="number"
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                disabled={!canStep1 || checker.isPending}
                onClick={async () => {
                  try {
                    const res = await checker.mutateAsync({ hallId, date, startTime, endTime })
                    if (res.available) setStep(2)
                  } catch {}
                }}
              >
                {checker.isPending ? "Checking..." : "Check Availability"}
              </Button>
              {!checker.isPending && checker.data && (
                <span className={checker.data.available ? "text-emerald-700" : "text-red-700"}>
                  {checker.data.available ? "Available" : "Unavailable"}
                </span>
              )}
              {checker.isError && <span className="text-red-600 text-sm">Error: {checker.error.message}</span>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button disabled={!canStep2} onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded border p-3 bg-gray-50">
              <div className="font-medium">Confirm Details</div>
              <ul className="mt-2 text-sm space-y-1">
                <li>Hall: {selectedHall?.name}</li>
                <li>Date: {date}</li>
                <li>
                  Time: {startTime} - {endTime}
                </li>
                <li>Guests: {guestCount}</li>
                <li>Name: {name}</li>
                <li>Phone: {phone}</li>
                <li>Email: {email}</li>
              </ul>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <ConfirmBooking
                venueId={venueId}
                hallId={hallId}
                date={date}
                startTime={startTime}
                endTime={endTime}
                guestCount={guestCount}
                name={name}
                phone={phone}
                email={email}
                onDone={() => setOpen(false)}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ConfirmBooking(props: {
  venueId: string
  hallId: string
  date: string
  startTime: string
  endTime: string
  guestCount: number
  name: string
  phone: string
  email: string
  onDone: () => void
}) {
  const create = useCreateBooking()
  return (
    <Button
      disabled={create.isPending}
      onClick={async () => {
        try {
          const payload: BookingRequest = {
            venueId: props.venueId,
            hallId: props.hallId,
            date: props.date,
            startTime: props.startTime,
            endTime: props.endTime,
            guestCount: props.guestCount,
            customerDetails: { name: props.name, phone: props.phone, email: props.email },
          }
          await create.mutateAsync(payload)
          props.onDone()
        } catch {}
      }}
    >
      {create.isPending ? "Booking..." : "Confirm Booking"}
    </Button>
  )
}

export default function VenuePage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { data, isLoading, isError, error } = useVenue(id)

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </main>
    )
  }
  if (isError || !data) {
    return (
      <main className="max-w-3xl mx-auto p-8">
        <p className="text-red-700">Error loading venue: {(error as Error)?.message ?? "Unknown error"}</p>
      </main>
    )
  }

  const firstHallId = data.halls[0]?.id

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-balance">{data.name}</h1>
        <p className="text-muted-foreground">
          {data.address}, {data.city}
        </p>
        <p className="text-sm">
          Rating: {data.rating.toFixed(1)} • ${data.priceRange.min}-{data.priceRange.max}/hr
        </p>
      </header>

      <Gallery images={data.images} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Availability</h2>
        <AvailabilityGrid availability={data.availability} />
      </section>

      <div>
        <BookingModal venueId={data.id} halls={data.halls} defaultHallId={firstHallId} />
      </div>

      <section>
        <h3 className="text-lg font-semibold">About this venue</h3>
        <p className="text-sm text-muted-foreground mt-2">{data.description}</p>
      </section>
    </main>
  )
}
