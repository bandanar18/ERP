import { type LucideIcon, ChevronRightIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface ActivityItem {
  title: string
  desc: string
  icon: LucideIcon
  color: string
  bg: string
  onClick?: () => void
}

export interface AccessItem {
  title: string
  desc: string
  icon: LucideIcon
  iconColor: string
  badgeText: string
  badgeColor: string
  linkText: string
  linkColor: string
  onClick?: () => void
}

interface ActivityAndAccessProps {
  activities: ActivityItem[]
  accessItems: AccessItem[]
  activitiesTitle?: string
  accessTitle?: string
}

export function ActivityAndAccess({
  activities,
  accessItems,
  activitiesTitle = "Actividades Recientes",
  accessTitle = "Accesos Rápidos"
}: ActivityAndAccessProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Actividades Recientes */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-bold text-slate-800">{activitiesTitle}</CardTitle>
          <span className="text-xs text-orange-500 cursor-pointer hover:underline">Ver todas</span>
        </CardHeader>
        <CardContent className="space-y-2">
          {activities.map((act, i) => (
            <div 
              key={i} 
              onClick={act.onClick}
              className={cn(
                "flex items-start gap-4 p-3 rounded-xl transition-all",
                act.onClick ? "cursor-pointer hover:bg-slate-50 hover:shadow-sm" : ""
              )}
            >
              <div className={cn("p-2 rounded-lg shrink-0", act.bg)}>
                <act.icon className={cn("h-4 w-4", act.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{act.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{act.desc}</p>
              </div>
              {act.onClick && (
                <ChevronRightIcon className="h-4 w-4 text-slate-300 self-center" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Accesos Rápidos */}
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-800 mb-4">{accessTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accessItems.map((item, i) => (
            <div 
              key={i} 
              onClick={item.onClick}
              className="p-5 border border-border/50 rounded-2xl hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer bg-white flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg bg-slate-50")}>
                  <item.icon className={cn("h-5 w-5", item.iconColor)} />
                </div>
                <Badge className={cn(item.badgeColor, "hover:opacity-90 shadow-none border-none text-[10px] font-bold uppercase")}>
                  {item.badgeText}
                </Badge>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[32px]">{item.desc}</p>
              </div>
              <span className={cn("text-xs font-bold flex items-center gap-1 mt-auto", item.linkColor)}>
                {item.linkText} <ChevronRightIcon className="h-3 w-3" />
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
