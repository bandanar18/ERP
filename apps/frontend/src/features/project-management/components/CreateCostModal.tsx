import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { costService } from "../api";
import { AlertCircle } from "lucide-react";
import { ErpModal } from "./ErpModal";

interface CreateCostModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lastCostEndDate?: string;
}

export function CreateCostModal({ projectId, isOpen, onClose, onSuccess, lastCostEndDate }: CreateCostModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amountUsd: "",
    startDate: "",
    endDate: ""
  });

  // Calcular el min date para el startDate si existe lastCostEndDate (al día siguiente)
  const getMinStartDate = () => {
    if (!lastCostEndDate) return undefined;
    const date = new Date(lastCostEndDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!formData.amountUsd || !formData.startDate || !formData.endDate) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (lastCostEndDate && new Date(formData.startDate) <= new Date(lastCostEndDate)) {
      setError("La fecha de inicio debe ser estrictamente posterior a la fecha fin del costo anterior.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await costService.create({
        projectId,
        amountUsd: Number(formData.amountUsd),
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      setFormData({ amountUsd: "", startDate: "", endDate: "" });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.error || err.message || "Error al registrar el costo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErpModal
      open={isOpen}
      onOpenChange={onClose}
      eyebrow="Planificación / Costos"
      title="Registrar Costo"
      description="Registra un nuevo costo planificado para el proyecto."
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="w-full rounded-none border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416] sm:w-auto">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="w-full rounded-none border border-[#4c9b7a] bg-[#4c9b7a] text-white hover:border-[#3d7f63] hover:bg-[#3d7f63] sm:w-auto">
            {loading ? "Guardando..." : "Guardar Costo"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-3 text-sm text-[#a84730]">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cost-amount" className="text-[12px] font-semibold text-[#111416]">Monto USD</label>
        <Input
          id="cost-amount"
          type="number"
          placeholder="Ej: 5000"
          value={formData.amountUsd}
          onChange={(e) => setFormData(prev => ({ ...prev, amountUsd: e.target.value }))}
          className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cost-start" className="text-[12px] font-semibold text-[#111416]">Fecha Inicio</label>
          <Input
            id="cost-start"
            type="date"
            min={getMinStartDate()}
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
          />
          {lastCostEndDate && (
            <span className="text-[10px] text-[#4e5558]">
              Debe ser posterior al {new Date(lastCostEndDate).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cost-end" className="text-[12px] font-semibold text-[#111416]">Fecha Fin</label>
          <Input
            id="cost-end"
            type="date"
            min={formData.startDate || getMinStartDate()}
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
          />
        </div>
      </div>
    </ErpModal>
  );
}
