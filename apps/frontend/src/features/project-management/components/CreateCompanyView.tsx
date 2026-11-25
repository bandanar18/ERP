import { ErpWizardForm, ErpInputField } from "./ErpWizardForm";
import { Building2, FileText, MapPin, Upload, X, ArrowLeft } from "lucide-react";
import { useState, useRef, type ChangeEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { companyService } from "../api";
import { fileGalleryService } from "../api";
import { useToast } from "@/shared/hooks/useToast";
import { PmAppShell } from "./PmAppShell";

const COMPANY_STEPS = [
  { id: 1, name: "Información Básica", description: "Datos de la empresa", icon: FileText },
  { id: 2, name: "Ubicación", description: "Dirección y contacto", icon: MapPin },
  { id: 3, name: "Información Fiscal", description: "Datos legales", icon: Building2 },
  { id: 4, name: "Resumen", description: "Verificar datos", icon: FileText },
];

export const CreateCompanyView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    taxId: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    email: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleChange = (field: keyof typeof formData) => (e: ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const renderStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
            <ErpInputField
              label="Nombre de la empresa"
              placeholder="Ej: Empresa C.A."
              required
              value={formData.name}
              onChange={handleChange("name")}
            />
            <ErpInputField
              label="Razón social"
              placeholder="Ej: Empresa C.A. RNC"
              required
              value={formData.legalName}
              onChange={handleChange("legalName")}
            />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-semibold text-[#111416]">Logo de la empresa</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-[#d8d0c4] bg-[#f5f0e8]/50">
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute right-1 top-1 rounded-full border border-[#d8d0c4] bg-[#fffdf9] p-1 text-[#4e5558] shadow-sm hover:text-[#c85454]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d8d0c4] bg-[#f5f0e8]/30 transition-colors hover:border-[#d9772f] hover:bg-[#f5f0e8]/60"
                  >
                    <Upload className="h-5 w-5 text-[#4e5558]" />
                    <span className="text-xs font-medium text-[#4e5558]">Subir</span>
                  </div>
                )}
                <div className="flex-1 text-[11px] text-[#4e5558]">
                  <p>Sube el logo de la empresa para mostrarlo en el sistema.</p>
                  <p className="mt-1">Formatos soportados: JPG, PNG. Tamaño máximo: 5MB.</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <ErpInputField
              label="Dirección"
              placeholder="Ej: Av. Principal #123"
              required
              value={formData.address}
              onChange={handleChange("address")}
            />
            <div className="grid gap-6 md:grid-cols-3">
              <ErpInputField
                label="Ciudad"
                placeholder="Ej: Caracas"
                required
                value={formData.city}
                onChange={handleChange("city")}
              />
              <ErpInputField
                label="Estado"
                placeholder="Ej: Distrito Capital"
                required
                value={formData.state}
                onChange={handleChange("state")}
              />
              <ErpInputField
                label="Código postal"
                placeholder="Ej: 1010"
                value={formData.postalCode}
                onChange={handleChange("postalCode")}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <ErpInputField
              label="RIF/Cédula fiscal"
              placeholder="Ej: J-12345678-9"
              required
              value={formData.taxId}
              onChange={handleChange("taxId")}
            />
            <div className="grid gap-6 md:grid-cols-2">
              <ErpInputField
                label="Teléfono"
                placeholder="Ej: +58-212-1234567"
                required
                value={formData.phone}
                onChange={handleChange("phone")}
              />
              <ErpInputField
                label="Email corporativo"
                placeholder="Ej: info@empresa.com"
                type="email"
                required
                value={formData.email}
                onChange={handleChange("email")}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 overflow-y-auto max-h-[280px] pr-2">
            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Información Básica
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Nombre</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.name || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Razón social</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.legalName || "-"}</dd>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Ubicación
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Dirección</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416] max-w-[200px]">{formData.address || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Ciudad</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.city || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Estado</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.state || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Código postal</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.postalCode || "-"}</dd>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/40 p-4">
              <h3 className="mb-3 text-[9px] font-bold uppercase tracking-[0.14em] text-[#b9561d]">
                Contacto y Fiscal
              </h3>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">RIF</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.taxId || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Teléfono</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.phone || "-"}</dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#d8d0c4]/50 bg-[#fffdf9] px-3 py-2">
                  <dt className="text-xs text-[#4e5558]">Email</dt>
                  <dd className="truncate pl-4 text-sm font-medium text-[#111416]">{formData.email || "-"}</dd>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      // Validar que haya nombre
      if (!formData?.name) {
        error("El nombre de la empresa es obligatorio");
        return;
      }

      // Combinar dirección completa
      const fullAddress = [
        formData.address,
        formData.city,
        formData.state,
        formData.postalCode
      ].filter(Boolean).join(", ");

      const newCompany = await companyService.create({
        name: formData.name,
        legalName: formData.legalName || undefined,
        taxId: formData.taxId || undefined,
        address: fullAddress || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
      });

      // Subir logo si fue seleccionado
      if (logoFile) {
        try {
          const uploadRes = await fileGalleryService.uploadFile('Company', newCompany.id, logoFile, { category: 'Logo' });
          await companyService.update(newCompany.id, { logoUrl: uploadRes.url });
        } catch (uploadErr) {
          console.error("Error al subir el logo:", uploadErr);
          error("La empresa se creó, pero hubo un error al subir el logo");
        }
      }

      success("Empresa creada correctamente");

      // Verificar de dónde viene para redirigir
      const from = (location.state as any)?.from;
      if (from === "create-project") {
        navigate("/project-management/create");
      } else {
        navigate("/project-management/explorar");
      }
    } catch (err: any) {
      console.error("Error al crear empresa:", err);
      const errorMsg = err?.error || err?.message || "Error al crear empresa";
      error(errorMsg);
    }
  };

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">Crear Empresa</strong>
        </>
      }
    >
      {/* Volver */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[11px] font-bold text-[#b9561d] transition-colors hover:text-[#111416] w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      <ErpWizardForm
        steps={COMPANY_STEPS}
        title="Crear Empresa"
        subtitle="Completa los pasos para crear una nueva empresa"
        renderStep={renderStep}
        onSubmit={handleSubmit}
      />
    </PmAppShell>
  );
};
