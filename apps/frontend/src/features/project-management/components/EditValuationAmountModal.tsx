import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financialService } from "../api";
import { AlertCircle } from "lucide-react";
import type { FinancialValuation } from "../interfaces/financial.types";
import { ErpModal } from "./ErpModal";

interface EditValuationAmountModalProps {
  valuation: FinancialValuation | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditValuationAmountModal({ valuation, isOpen, onClose, onSuccess }: EditValuationAmountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (valuation) {
      setAmount(String(valuation.amountUsd));
      setError(null);
    } else {
      setAmount("");
      setError(null);
    }
  }, [valuation, isOpen]);

  const handleSubmit = async () => {
    if (!valuation) return;

    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await financialService.updateAmount(valuation.id, { amountUsd: Number(amount) });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.error || err.message || "Error al actualizar el monto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErpModal
      open={isOpen}
      onOpenChange={onClose}
      eyebrow="Finanzas / Valuaciones"
      title="Editar Monto"
      description={`Modificá el monto de la valuación ${valuation?.valuationNumber ?? ""}. Solo se permite editar valuaciones que estén "Por Valuar" o "Por Facturar".`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416]">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-lg border border-[#d9772f] bg-[#d9772f] text-white hover:border-[#b9561d] hover:bg-[#b9561d]">
            {loading ? "Guardando..." : "Guardar Monto"}
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
        <label htmlFor="valuation-amount" className="text-[12px] font-semibold text-[#111416]">Nuevo Monto</label>
        <Input
          id="valuation-amount"
          type="number"
          placeholder="Ej: 15000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
        />
      </div>
    </ErpModal>
  );
}
