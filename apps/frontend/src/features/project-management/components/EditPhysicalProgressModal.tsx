import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { physicalProgressService } from "../services/physical-progress.service";
import { AlertCircle } from "lucide-react";

interface EditPhysicalProgressModalProps {
  progress: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPhysicalProgressModal({ progress, isOpen, onClose, onSuccess }: EditPhysicalProgressModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    actualProgress: "",
    plannedProgress: "",
    attentionPoints: "",
  });

  useEffect(() => {
    if (progress) {
      setFormData({
        startDate: progress.startDate ? new Date(progress.startDate).toISOString().split('T')[0] : "",
        endDate: progress.endDate ? new Date(progress.endDate).toISOString().split('T')[0] : "",
        actualProgress: progress.actualProgress || "",
        plannedProgress: progress.plannedProgress || "",
        attentionPoints: progress.attentionPoints || "",
      });
      setError(null);
    } else {
      setFormData({
        startDate: "",
        endDate: "",
        actualProgress: "",
        plannedProgress: "",
        attentionPoints: "",
      });
      setError(null);
    }
  }, [progress, isOpen]);

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!progress) return;

    if (!formData.actualProgress || !formData.plannedProgress) {
      setError("Avance Real y Avance Planificado son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await physicalProgressService.update(progress.id, {
        actualProgress: formData.actualProgress,
        plannedProgress: formData.plannedProgress,
        attentionPoints: formData.attentionPoints || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.error || err.message || "Error al actualizar el avance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Avance Físico</DialogTitle>
          <DialogDescription>
            Modificá los datos del avance físico seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={handleChange("startDate")}
                className="rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={handleChange("endDate")}
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Avance Real (%)</Label>
              <Input
                placeholder="Ej: 45%"
                value={formData.actualProgress}
                onChange={handleChange("actualProgress")}
                className="rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Avance Planificado (%)</Label>
              <Input
                placeholder="Ej: 50%"
                value={formData.plannedProgress}
                onChange={handleChange("plannedProgress")}
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Puntos de Atención</Label>
            <Input
              placeholder="Observaciones, retrasos o puntos importantes..."
              value={formData.attentionPoints}
              onChange={handleChange("attentionPoints")}
              className="rounded-lg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-lg">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-orange-500 hover:bg-orange-600">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
