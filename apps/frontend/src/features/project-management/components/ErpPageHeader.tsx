import type { ReactNode } from "react"

type ErpPageHeaderProps = {
  eyebrow: string
  title: string
  copy?: string
  action?: ReactNode
  /** Tamaño del título (default: clamp(40px,4.5vw,60px)) */
  titleClass?: string
}

/**
 * Cabecera de página estilo Business ERP: eyebrow en naranja, título en
 * Bebas Neue y subtítulo opcional, con acción a la derecha.
 */
export function ErpPageHeader({ eyebrow, title, copy, action, titleClass }: ErpPageHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-6 max-[1024px]:flex-col max-[1024px]:items-start">
      <div>
        <p className="mb-[4px] text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">{eyebrow}</p>
        <h1
          id="page-title"
          className={`font-display mb-1 font-normal leading-[0.9] tracking-[0.01em] ${
            titleClass ?? "text-[clamp(28px,3vw,42px)]"
          }`}
        >
          {title}
        </h1>
        {copy && <p className="text-[11px] text-[#4e5558]">{copy}</p>}
      </div>
      {action && <div className="flex w-full min-w-0 justify-end max-[1024px]:justify-start">{action}</div>}
    </div>
  )
}
