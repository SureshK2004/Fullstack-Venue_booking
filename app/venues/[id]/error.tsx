"use client"
export default function Error({ error }: { error: Error }) {
  return (
    <div className="max-w-2xl mx-auto p-6 text-red-700">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm">{error.message}</p>
    </div>
  )
}
