import { useState, useEffect } from "react"
import { authService } from "../services/auth.service"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role?: {
    name: string
  } | null
  isClient: boolean
  isActive: boolean
  emailVerified: boolean
}

/**
 * Hook para obtener el usuario actual de forma reactiva.
 * Escucha cambios en localStorage y actualiza el estado.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(() => authService.getUser())

  useEffect(() => {
    // Escuchar cambios en localStorage (para cuando se hace login/logout en otras pestañas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "token") {
        setUser(authService.getUser())
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  return user
}
