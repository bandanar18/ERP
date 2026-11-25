import { useState } from "react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/features/executive/components/ui/dialog"
import { Textarea } from "@/features/executive/components/ui/textarea"
import { Button } from "@/features/executive/components/ui/button"
import { useUpdateMeasurementStatus } from "../../shared/hooks/useMeasurements"

export function ReviewMeasurementDialog({
  measurement,
  open,
  onOpenChange,
}: {
  measurement: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [comment, setComment] = useState("")
  const reviewMutation = useUpdateMeasurementStatus()

  if (!measurement) return null

  const review = async (status: "APPROVED" | "REJECTED") => {
    await reviewMutation.mutateAsync({
      id: measurement.id,
      status,
      justification: comment.trim() || undefined,
    })
    setComment("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar medición</DialogTitle>
          <DialogDescription>
            {measurement.version?.indicator?.name} · {measurement.period?.label}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">Valor reportado</p>
            <p className="text-xl font-bold">
              {measurement.value} {measurement.version?.targets?.[0]?.unit}
            </p>
          </div>

          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-xs text-muted-foreground">Meta</p>
            <p className="text-xl font-bold">
              {measurement.version?.direction === 'AT_MOST' ? 'Máximo ' : measurement.version?.direction === 'AT_LEAST' ? 'Mínimo ' : measurement.version?.direction === 'RANGE' ? 'Entre ' : ''}
              {measurement.version?.targets?.[0]?.targetValue}
              {" "}
              {measurement.version?.targets?.[0]?.unit}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-1 text-sm font-medium">Observación del responsable</p>
            <p className="rounded-lg border bg-slate-50 p-3 text-sm">
              {measurement.observation || "Sin observación registrada."}
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="review-comment" className="mb-1 block text-sm font-medium">
              Comentario de revisión
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Indica el motivo de aprobación o rechazo..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 sm:w-auto text-white"
            disabled={reviewMutation.isPending || (comment.trim() === '' && false /* just to keep it readable, although only required for reject */)}
            onClick={() => review("APPROVED")}
          >
            {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Aprobar
          </Button>

          <Button
            variant="destructive"
            className="w-full gap-2 sm:w-auto"
            disabled={reviewMutation.isPending || comment.trim() === ''}
            onClick={() => review("REJECTED")}
          >
            <XCircle className="h-4 w-4" />
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
