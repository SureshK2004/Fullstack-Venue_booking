"use client"

import { useEffect, useState } from "react"

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<"customer" | "admin" | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem("token"))
    setRole((localStorage.getItem("role") as "customer" | "admin" | null) ?? "customer")
  }, [])

  return { token, role, isAuthenticated: !!token }
}
