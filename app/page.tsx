import Link from "next/link"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Venue Booking MVP</h1>
      <p className="text-muted-foreground">Go to a sample venue detail page to try the booking flow.</p>
      <Link className="underline text-primary" href="/venues/v_1">
        View Grand Aurora Convention Center
      </Link>
    </main>
  )
}
