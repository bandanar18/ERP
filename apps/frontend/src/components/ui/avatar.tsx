interface AvatarProps {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  className?: string
}

/**
 * Avatar con iniciales del usuario.
 * Muestra las primeras letras del nombre y apellido en un círculo con colores.
 */
export function Avatar({ firstName, lastName, email, className = "" }: AvatarProps) {
  // Obtener iniciales
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase()
    }
    if (lastName) {
      return lastName.charAt(0).toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return "?"
  }

  // Generar color basado en el string (consistente para el mismo usuario)
  const getAvatarColor = (str: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-cyan-500",
      "bg-emerald-500",
    ]

    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  const initials = getInitials()
  const seed = `${firstName || ""}${lastName || ""}${email || ""}` || "default"
  const bgColor = getAvatarColor(seed)

  return (
    <div
      className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${bgColor} ${className}`}
    >
      {initials}
    </div>
  )
}
