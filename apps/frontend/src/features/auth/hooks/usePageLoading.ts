import { useState, useEffect } from "react"

const MIN_LOADING_TIME = 400 // 500ms mínimo - más rápido pero visible

/**
 * Hook que maneja el estado de carga con un tiempo mínimo de visualización.
 * Muestra el skeleton por al menos 500ms en cada carga o recarga de página.
 */
export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const startTime = Date.now()


    // Calcular tiempo restante para completar el mínimo
    const elapsed = Date.now() - startTime
    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, remainingTime)

    // Escuchar evento de carga completa de la página
    const handleLoad = () => {
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed)

      setTimeout(() => {
        setIsLoading(false)
      }, remainingTime)
    }

    // Si la página ya está cargada, usar el timer
    if (document.readyState === "complete") {
      // El timer ya está configurado arriba
    } else {
      window.addEventListener("load", handleLoad)
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener("load", handleLoad)
    }
  }, [])

  return { isLoading }
}
