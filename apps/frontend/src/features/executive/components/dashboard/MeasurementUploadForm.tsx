import React, { useState } from 'react';
import { useSubmitMeasurement } from '../../shared/hooks/useMeasurements';
import { Button } from '@/features/executive/components/ui/button';
import { Input } from '@/features/executive/components/ui/input';
import { Textarea } from '@/features/executive/components/ui/textarea';
import { Label } from '@/features/executive/components/ui/label';
import { toast } from 'sonner';

interface MeasurementUploadFormProps {
  indicatorVersionId?: string;
  periodId?: string;
  formulaVariables?: string[];
  inputMode?: 'DIRECT_VALUE' | 'FORMULA_INPUTS';
  displayAsPercent?: boolean;
  onSuccess?: () => void;
}

export const MeasurementUploadForm: React.FC<MeasurementUploadFormProps> = ({
  indicatorVersionId,
  periodId,
  formulaVariables = ['valor_directo'],
  inputMode = 'FORMULA_INPUTS',
  displayAsPercent = false,
  onSuccess,
}) => {
  const { mutateAsync: submitMeasurement, isPending } = useSubmitMeasurement();
  
  const formatLabel = (name: string) => 
    name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const INPUT_LABELS: Record<string, string> = {
    montoFacturado: "Monto facturado en el mes",
    montoActividadesEjecutadas: "Monto de actividades ejecutadas en el mes",
    proveedoresConfiables: "Cantidad de proveedores confiables",
    proveedoresRequierenMejoras: "Cantidad de proveedores que requieren mejoras",
    proveedoresSuspendidos: "Cantidad de proveedores suspendidos",
  };

  const [inputs, setInputs] = useState<Record<string, number | ''>>(
    formulaVariables.reduce((acc, variable) => ({ ...acc, [variable]: '' }), {}),
  );
  const [directValue, setDirectValue] = useState<number | ''>('');
  const [observation, setObservation] = useState('');

  const handleInputChange = (variable: string, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [variable]: value ? Number(value) : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!indicatorVersionId || !periodId) {
      toast.error('Error de configuración', { description: 'Faltan datos de configuración (Versión o Periodo).' });
      return;
    }

    if (inputMode === 'FORMULA_INPUTS') {
      for (const variable of formulaVariables) {
        if (inputs[variable] === '') {
          toast.error('Campo requerido', { description: `Falta ingresar el valor para: ${variable.replace(/_/g, ' ')}` });
          return;
        }
      }
    } else {
      if (directValue === '') {
        toast.error('Campo requerido', { description: `Falta ingresar el valor de la medición` });
        return;
      }
    }
    
    try {
      await submitMeasurement({
        indicatorVersionId,
        periodId,
        directValue: inputMode === 'DIRECT_VALUE' ? (directValue as number) : undefined,
        inputs: inputMode === 'FORMULA_INPUTS' ? (inputs as Record<string, number>) : {},
        observation,
        evidenceIds: [],
      });
      toast.success('Medición registrada', { description: 'La medición fue registrada exitosamente.' });
      setInputs(formulaVariables.reduce((acc, variable) => ({ ...acc, [variable]: '' }), {}));
      setDirectValue('');
      setObservation('');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Ocurrió un error al enviar la medición.';
      toast.error('Error al enviar', { description: msg });
    }
  };

  const isFormulaBased = formulaVariables.length > 0 && inputMode === 'FORMULA_INPUTS';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {isFormulaBased
          ? "Registra los valores requeridos. El resultado se calculará automáticamente."
          : "Registra el valor informado por el proceso para este período."}
      </p>
      {inputMode === 'FORMULA_INPUTS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formulaVariables.map((variable) => (
            <div key={variable} className="space-y-2">
              <Label htmlFor={variable} className="text-foreground/80 font-bold text-sm">
                {INPUT_LABELS[variable] ?? formatLabel(variable)}
              </Label>
              <Input
                id={variable}
                type="number"
                step="0.01"
                value={inputs[variable]}
                onChange={(e) => handleInputChange(variable, e.target.value)}
                placeholder={`Ingrese valor...`}
                required
                className="focus-visible:ring-primary h-11"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="directValue" className="text-foreground/80 font-bold text-sm">
            {displayAsPercent ? 'Porcentaje de cumplimiento' : 'Valor reportado'}
          </Label>
          <div className="relative">
            <Input
              id="directValue"
              type="number"
              step="0.01"
              value={directValue}
              onChange={(e) => setDirectValue(e.target.value ? Number(e.target.value) : '')}
              placeholder={displayAsPercent ? "Ej. 95" : "Ingrese valor..."}
              className={displayAsPercent ? "pr-10 focus-visible:ring-primary h-11" : "focus-visible:ring-primary h-11"}
              required
            />
            {displayAsPercent && (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground font-medium">
                %
              </span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="observation" className="text-foreground/80 font-bold uppercase tracking-wider text-xs">Análisis / Observaciones (Opcional)</Label>
        <Textarea
          id="observation"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Justificación o análisis breve de esta medición..."
          rows={4}
          className="focus-visible:ring-primary resize-none"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-12 text-md shadow-sm transition-all"
        disabled={isPending}
      >
        {isPending ? 'Procesando...' : 'Guardar Medición'}
      </Button>
    </form>
  );
};
