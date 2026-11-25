import { ChevronRightIcon, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { cn } from "@/lib/utils"

export interface IModulesData{
    title: string,
    desc:  string,
    icon:  LucideIcon,
    bg:    string,
    linkColor: string,
    iconColor: string 
}

interface ModulesProps{
    modules: IModulesData[]
    onModuleClick?: (module: IModulesData) => void
}

export function ModulesGrid({modules, onModuleClick}: ModulesProps) {

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Módulos de Gestión</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((mod, i) => (
          <Card 
            key={i} 
            onClick={() => onModuleClick?.(mod)}
            className="shadow-sm border-border/50 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer bg-white"
          >
            <CardContent className="flex flex-col items-start p-6">
              <div className={cn("rounded-xl w-fit transition-transform group-hover:scale-110", mod.bg)}>
                <mod.icon className={cn("h-6 w-6", mod.iconColor)} />
              </div>
              <div className="flex-1 w-full">
                <h4 className="font-bold text-slate-800 text-base mb-2">{mod.title}</h4>
                <p className="text-xs text-muted-foreground mb-6 line-clamp-2 min-h-[32px]">{mod.desc}</p>
              </div>
              <span className={cn("text-xs font-bold flex items-center gap-1 mt-auto", mod.linkColor)}>
                Acceder <ChevronRightIcon className="h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}