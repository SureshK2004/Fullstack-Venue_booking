"use client"

import type React from "react"
import { useState } from "react"
import type {
  VenueDetailResponse,
  Hall,
  AvailabilityResponse,
  BookingRequest,
  BookingConfirmation,
} from "@/types/venue"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/services/api"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const bookingStepSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  guestCount: z.coerce.number().int().min(1),
  name: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email(),
})

export default function VenueView({ data }: { data: VenueDetailResponse }) {
  const { venue, halls, availability } = data
  const [selectedHall, setSelectedHall] = useState<Hall | null>(halls[0] ?? null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    guestCount: "",
    name: "",
    phone: "",
    email: "",
  })
  const [checkResult, setCheckResult] = useState<AvailabilityResponse | null>(null)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const disabled = !selectedHall

  const checkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedHall) throw new Error("Select a hall")
      const payload = {
        hallId: selectedHall.id,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      }
      return apiClient.post<AvailabilityResponse>(`/api/venues/${venue.id}/check-availability`, payload)
    },
    onSuccess: (res) => {
      setCheckResult(res)
      if (res.available) setStep(2)
    },
  })

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedHall) throw new Error("Select a hall")
      const parse = bookingStepSchema.safeParse({ ...form, guestCount: Number(form.guestCount) })
      if (!parse.success) throw new Error("Please fill all fields correctly")
      const payload: BookingRequest = {
        venueId: venue.id,
        hallId: selectedHall.id,
        date: parse.data.date,
        startTime: parse.data.startTime,
        endTime: parse.data.endTime,
        guestCount: parse.data.guestCount,
        customerDetails: { name: parse.data.name, phone: parse.data.phone, email: parse.data.email },
      }
      return apiClient.post<BookingConfirmation>("/api/bookings", payload)
    },
    onSuccess: (res) => {
      setConfirmation(res)
      setStep(3)
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-balance">{venue.name}</h1>
        <p className="text-muted-foreground">
          {venue.address}, {venue.city}
        </p>
        <p className="text-sm">
          Rating: {venue.rating.toFixed(1)} • ${venue.priceRange.min}-{venue.priceRange.max}/hr
        </p>
      </header>

      {/* Gallery */}
      <div className="grid grid-cols-3 gap-3">
        {venue.images.slice(0, 3).map((src, i) => (
          <img
            key={i}
            src={src || "/placeholder.svg?height=240&width=400&query=venue%20image"}
            alt={`Photo ${i + 1} of ${venue.name}`}
            className="rounded-md object-cover h-48 w-full"
          />
        ))}
      </div>

      {/* Hall + Availability */}
      <div className="flex flex-col md:flex-row gap-4 md:items-end">
        <div className="w-full md:max-w-xs">
          <Label className="mb-2 block">Hall</Label>
          <Select
            value={selectedHall?.id}
            onValueChange={(val) => setSelectedHall(halls.find((h) => h.id === val) || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select hall" />
            </SelectTrigger>
            <SelectContent>
              {halls.map((h) => (
                <SelectItem value={h.id} key={h.id}>
                  {h.name} • {h.capacityMin}-{h.capacityMax} guests • ${h.pricePerHour}/hr
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-3">
          <div>
            <Label className="mb-2 block">Date</Label>
            <Input type="date" name="date" value={form.date} onChange={handleChange} />
          </div>
          <div>
            <Label className="mb-2 block">Start</Label>
            <Input type="time" name="startTime" value={form.startTime} onChange={handleChange} />
          </div>
          <div>
            <Label className="mb-2 block">End</Label>
            <Input type="time" name="endTime" value={form.endTime} onChange={handleChange} />
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={disabled}
              onClick={() => {
                setOpen(true)
                setStep(1)
                setCheckResult(null)
                setConfirmation(null)
              }}
            >
              Check Availability
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {step === 1 && "Step 1: Check Availability"}
                {step === 2 && "Step 2: Guest Details"}
                {step === 3 && "Step 3: Confirmation"}
              </DialogTitle>
            </DialogHeader>

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  We’ll verify your selected time for {selectedHall?.name}.
                </p>
                <Button disabled={checkMutation.isPending} onClick={() => checkMutation.mutate()}>
                  {checkMutation.isPending ? "Checking..." : "Run Check"}
                </Button>
                {checkMutation.isError && (
                  <p className="text-sm text-red-600">Error: {(checkMutation.error as Error).message}</p>
                )}
                {checkResult && (
                  <div
                    className={cn(
                      "rounded-md p-3",
                      checkResult.available ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                    )}
                  >
                    {checkResult.available ? "Timeslot is available!" : "Conflicts found."}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Guests</Label>
                    <Input name="guestCount" type="number" min={1} value={form.guestCount} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input name="name" value={form.name} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input name="email" type="email" value={form.email} onChange={handleChange} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button disabled={bookMutation.isPending} onClick={() => bookMutation.mutate()}>
                    {bookMutation.isPending ? "Booking..." : "Confirm Booking"}
                  </Button>
                </div>
                {bookMutation.isError && (
                  <p className="text-sm text-red-600">Error: {(bookMutation.error as Error).message}</p>
                )}
              </div>
            )}

            {step === 3 && confirmation && (
              <div className="space-y-3">
                <p className="text-sm">
                  Booking ID: <span className="font-mono">{confirmation.id}</span>
                </p>
                <p className="text-sm">Status: {confirmation.status}</p>
                <p className="text-sm">Total: ${confirmation.totalAmount.toFixed(2)}</p>
                <div className="flex justify-end">
                  <Button onClick={() => setOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Availability Grid (simple visual) */}
      <div className="rounded-md border">
        <div className="grid grid-cols-7 text-center text-sm font-medium border-b">
          {Object.keys(availability)
            .slice(0, 7)
            .map((d) => (
              <div key={d} className="p-2">
                {d}
              </div>
            ))}
        </div>
        <div className="grid grid-cols-7 text-center text-xs">
          {Object.values(availability)
            .slice(0, 7)
            .map((slots, idx) => (
              <div key={idx} className="p-2 min-h-16">
                {slots.length === 0 ? (
                  <span className="text-emerald-600">Open</span>
                ) : (
                  slots.map((s) => (
                    <div key={s} className="bg-red-100 text-red-700 rounded px-1 py-0.5 mb-1 inline-block">
                      {s}
                    </div>
                  ))
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}
