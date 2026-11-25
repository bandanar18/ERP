import { useState } from "react"
import { type AccessItem } from "@/components/ActivityAndAccess"
import { type IModulesData } from "@/components/ModuleGrid"
import { 
  FileText, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Handshake, 
  Network 
} from "lucide-react"

// Mapa de iconos para recuperarlos después de la serialización
const ICON_MAP: Record<string, any> = {
  "FileText": FileText,
  "ShoppingCart": ShoppingCart,
  "DollarSign": DollarSign,
  "Users": Users,
  "Handshake": Handshake,
  "Network": Network
}

interface UseRecentAccessProps {
  initialAccess: AccessItem[]
  limit?: number
}

const STORAGE_KEY = "recent_access_items"

export function useRecentAccess({ initialAccess, limit = 2 }: UseRecentAccessProps) {
  const [recentAccess, setRecentAccess] = useState<AccessItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Restauramos las funciones de los iconos desde el mapa
          return parsed.map((item: any) => ({
            ...item,
            icon: ICON_MAP[item.iconName] || FileText // Fallback a un icono genérico
          }))
        }
      } catch (e) {
        console.error("Error parsing recent access", e)
      }
    }
    return initialAccess
  })

  const handleModuleClick = (mod: IModulesData) => {
    // Buscamos el nombre del icono para guardarlo


    const newAccessItem: AccessItem = {
      title: mod.title,
      desc: mod.desc,
      icon: mod.icon,
      iconColor: mod.iconColor,
      badgeText: "Módulo",
      badgeColor: "bg-orange-500",
      linkText: "Ingresar",
      linkColor: "text-orange-500"
    }

    setRecentAccess(prev => {
      const filtered = prev.filter(item => item.title !== newAccessItem.title)
      const newState = [newAccessItem, ...filtered].slice(0, limit)
      
      // Guardamos en localStorage pero reemplazando la función del icono por su nombre
      const toStore = newState.map(item => {
        const { icon, ...rest } = item
        const currentIconName = Object.keys(ICON_MAP).find(key => ICON_MAP[key] === icon) || "FileText"
        return { ...rest, iconName: currentIconName }
      })
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
      return newState
    })
  }

  return {
    recentAccess,
    handleModuleClick
  }
}
