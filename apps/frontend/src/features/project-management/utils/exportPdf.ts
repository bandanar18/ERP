import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const isUnsupportedColor = (str: string): boolean => {
  return /oklch|oklab|lab|lch|color-mix|light-dark|color\(/i.test(str)
}

function createSafeStyleProxy(style: CSSStyleDeclaration): CSSStyleDeclaration {
  return new Proxy(style, {
    get(target, prop: string) {
      const val = target[prop as any]
      if (typeof val === "string" && isUnsupportedColor(val)) {
        const lower = prop.toLowerCase()
        if (lower.includes("background")) return "#ffffff"
        if (lower.includes("border")) return "#d8d0c4"
        return "#111416"
      }
      if (typeof val === "function") {
        if (prop === "getPropertyValue") {
          return (property: string) => {
            const res = target.getPropertyValue(property)
            if (typeof res === "string" && isUnsupportedColor(res)) {
              const lower = property.toLowerCase()
              if (lower.includes("background")) return "#ffffff"
              if (lower.includes("border")) return "#d8d0c4"
              return "#111416"
            }
            return res
          }
        }
        return (val as (...args: unknown[]) => unknown).bind(target)
      }
      return val
    },
  })
}

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const origWindowGetComputedStyle = window.getComputedStyle.bind(window)

  try {
    // Interceptar temporalmente getComputedStyle en la ventana principal
    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
      const style = origWindowGetComputedStyle(elt, pseudoElt)
      return createSafeStyleProxy(style)
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        // 1. Localizar el elemento clonado a capturar
        const clonedTarget =
          (element.id ? clonedDoc.getElementById(element.id) : null) ||
          clonedDoc.querySelector("article")

        if (clonedTarget) {
          // Desactivar transforms, overflow y límites de altura en todos los ancestros dentro del clon
          let ancestor: HTMLElement | null = clonedTarget.parentElement
          while (ancestor && ancestor !== clonedDoc.body) {
            ancestor.style.transform = "none"
            ancestor.style.webkitTransform = "none"
            ancestor.style.position = "static"
            ancestor.style.overflow = "visible"
            ancestor.style.maxHeight = "none"
            ancestor.style.height = "auto"
            ancestor.style.width = "auto"
            ancestor.style.maxWidth = "none"
            ancestor.scrollTop = 0
            ancestor.scrollLeft = 0
            ancestor = ancestor.parentElement
          }

          if (clonedDoc.documentElement) {
            clonedDoc.documentElement.scrollTop = 0
            clonedDoc.documentElement.scrollLeft = 0
          }
          if (clonedDoc.body) {
            clonedDoc.body.scrollTop = 0
            clonedDoc.body.scrollLeft = 0
          }

          // Fijar dimensiones de escritorio A4 en el elemento clonado para evitar colapso de estilos
          clonedTarget.style.width = "820px"
          clonedTarget.style.maxWidth = "820px"
          clonedTarget.style.minWidth = "820px"
          clonedTarget.style.margin = "0 auto"
          clonedTarget.style.position = "static"
          clonedTarget.style.transform = "none"
          clonedTarget.style.backgroundColor = "#ffffff"
          clonedTarget.style.boxSizing = "border-box"
          clonedTarget.style.overflow = "visible"
        }

        // 2. Limpiar atributos de estilo inline específicos si contienen funciones modernas
        const allElements = clonedDoc.querySelectorAll("*")
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement
          const styleAttr = htmlEl.getAttribute("style")
          if (styleAttr && isUnsupportedColor(styleAttr)) {
            htmlEl.setAttribute(
              "style",
              styleAttr
                .replace(/color-mix\([^;}]+\)/gi, "rgba(0,0,0,0.5)")
                .replace(/(?:oklch|oklab|lab|lch|light-dark|color)\([^;}]+\)/gi, "#111416")
            )
          }
        })

        // 3. Interceptar getComputedStyle en el iframe de html2canvas (el único canal que html2canvas consulta)
        const iframeWin = clonedDoc.defaultView
        if (iframeWin && iframeWin.getComputedStyle) {
          const origIframeGetComputedStyle = iframeWin.getComputedStyle.bind(iframeWin)
          iframeWin.getComputedStyle = function (elt: Element, pseudoElt?: string | null) {
            const style = origIframeGetComputedStyle(elt, pseudoElt)
            return createSafeStyleProxy(style)
          }
        }
      },
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  } finally {
    // Restaurar getComputedStyle en la ventana principal de inmediato
    window.getComputedStyle = origWindowGetComputedStyle
  }
}
