import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financialService } from "../api";
import { AlertCircle } from "lucide-react";
import type { FinancialValuation } from "../interfaces/financial.types";
import { ErpModal } from "./ErpModal";

interface UpdateValuationStatusModalProps {
  valuation: FinancialValuation | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateValuationStatusModal({ valuation, isOpen, onClose, onSuccess }: UpdateValuationStatusModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const handleSubmit = async () => {
    if (!valuation) return;
    if (!invoiceNumber.trim()) {
      setError("El número de factura es obligatorio para pasar a estado FACTURADO.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await financialService.updateStatus(valuation.id, {
        status: "FACTURADO",
        invoiceNumber
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.error || err.message || "Error al actualizar el estado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErpModal
      open={isOpen}
      onOpenChange={onClose}
      eyebrow="Finanzas / Facturación"
      title="Pasar a Facturado"
      description={`Ingresa el número de factura para confirmar que la valuación ${valuation?.valuationNumber ?? ""} ha sido facturada.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416]">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-lg border border-[#4c9b7a] bg-[#4c9b7a] text-white hover:border-[#3d7f63] hover:bg-[#3d7f63]">
            {loading ? "Confirmando..." : "Confirmar Facturación"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#edb6a5] bg-[#fff0eb] p-3 text-sm text-[#a84730]">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="invoice-number" className="text-[12px] font-semibold text-[#111416]">Número de Factura</label>
        <Input
          id="invoice-number"
          placeholder="Ej: A-0001-00001234"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-sm text-[#111416] shadow-none focus-visible:border-[#d9772f] focus-visible:ring-[#d9772f]/25"
        />
      </div>
    </ErpModal>
  );
}
