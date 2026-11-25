import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financialService } from "../api";
import { AlertCircle } from "lucide-react";
import { ErpModal } from "./ErpModal";

interface CreateValuationModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateValuationModal({ projectId, isOpen, onClose, onSuccess }: CreateValuationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    valuationNumber: "",
    amountUsd: "",
    startDate: "",
    endDate: ""
  });

  const handleSubmit = async () => {
    if (!formData.valuationNumber || !formData.amountUsd || !formData.startDate || !formData.endDate) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await financialService.create({
        projectId,
        valuationNumber: formData.valuationNumber,
        amountUsd: Number(formData.amountUsd),
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.error || err.message || "Error al crear la valuación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErpModal
      open={isOpen}
      onOpenChange={onClose}
      eyebrow="Finanzas / Valuaciones"
      title="Nueva Valuación"
      description="Registra una nueva valuación. El monto no debe exceder el presupuesto disponible."
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416] sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg border border-[#d9772f] bg-[#d9772f] text-white hover:border-[#b9561d] hover:bg-[#b9561d] sm:w-auto"
          >
            {loading ? "Guardando..." : "Guardar Valuación"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-3 text-sm text-[#a84730]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="valuation-number" className="text-[12px] font-semibold text-[#111416]">Nro. de Valuación</label>
        <Input
          id="valuation-number"
          placeholder="Ej: VAL-001"
          value={formData.valuationNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, valuationNumber: e.target.value }))}
          className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="valuation-amount-usd" className="text-[12px] font-semibold text-[#111416]">Monto USD</label>
        <Input
          id="valuation-amount-usd"
          type="number"
          placeholder="Ej: 15000"
          value={formData.amountUsd}
          onChange={(e) => setFormData(prev => ({ ...prev, amountUsd: e.target.value }))}
          className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="valuation-start" className="text-[12px] font-semibold text-[#111416]">Fecha Inicio</label>
          <Input
            id="valuation-start"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="valuation-end" className="text-[12px] font-semibold text-[#111416]">Fecha Fin</label>
          <Input
            id="valuation-end"
            type="date"
            min={formData.startDate}
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
          />
        </div>
      </div>
    </ErpModal>
  );
}
