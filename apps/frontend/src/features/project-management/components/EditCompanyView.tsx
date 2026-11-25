import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Building2, ChevronLeft, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { companyService, type Company } from "../services/company.service"
import { fileGalleryService } from "../services/file-gallery.service"
import { PmAppShell } from "./PmAppShell"
import { ErpPageHeader } from "./ErpPageHeader"
import { ErpModal } from "./ErpModal"
import { useToast } from "@/shared/hooks/useToast"

type CompanyForm = {
  name: string
  legalName: string
  taxId: string
  email: string
  phone: string
  address: string
}

type FieldErrors = Partial<Record<keyof CompanyForm | "logo", string>>

const EMPTY_FORM: CompanyForm = {
  name: "",
  legalName: "",
  taxId: "",
  email: "",
  phone: "",
  address: "",
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LOGO_BYTES = 5 * 1024 * 1024

const toForm = (company: Company): CompanyForm => ({
  name: company.name ?? "",
  legalName: company.legalName ?? "",
  taxId: company.taxId ?? "",
  email: company.email ?? "",
  phone: company.phone ?? "",
  address: company.address ?? "",
})

const validateForm = (form: CompanyForm): FieldErrors => {
  const errors: FieldErrors = {}
  if (!form.name.trim()) errors.name = "El nombre de la empresa es obligatorio"
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Ingresa un correo electrónico válido"
  }
  if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Ingresa un teléfono válido, con al menos 7 dígitos"
  }
  return errors
}

const inputClass = (invalid: boolean) =>
  [
    "h-10 w-full rounded-lg border bg-[#fffdf9] px-3 text-sm text-[#111416] outline-none transition-[border-color,box-shadow] placeholder:text-[#8d918f]",
    "focus:border-[#d9772f] focus:shadow-[0_0_0_3px_rgba(217,119,47,0.12)]",
    invalid ? "border-[#c85454]" : "border-[#d8d0c4]",
  ].join(" ")

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[12px] font-semibold text-[#111416]">
        {label}
        {required && <span className="text-[#c85454]"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-[#a84730]">
          {error}
        </p>
      )}
    </div>
  )
}

function Section({ title, copy, children }: { title: string; copy: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#d8d0c4] bg-[#fffdf9] p-4 sm:p-6">
      <h2 className="text-[15px] font-bold text-[#111416]">{title}</h2>
      <p className="mt-1 mb-5 text-xs leading-5 text-[#4e5558]">{copy}</p>
      {children}
    </section>
  )
}

export function EditCompanyView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const baselineRef = useRef("")
  const bypassRef = useRef(false)
  const pendingNav = useRef<(() => void) | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const [form, setForm] = useState<CompanyForm>(EMPTY_FORM)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const companyPath = `/project-management/empresa/${id}`
  const isDirty =
    JSON.stringify(form) !== baselineRef.current || Boolean(logoFile) || removeLogo

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        setLoadError("")
        const data = await companyService.getById(id)
        if (!active) return
        const next = toForm(data)
        baselineRef.current = JSON.stringify(next)
        setForm(next)
        setCompany(data)
        setLogoPreview(data.logoUrl ?? null)
      } catch (err: any) {
        if (!active) return
        setLoadError(err?.error || err?.message || "No se pudo cargar la empresa")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isDirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }

    const onClickCapture = (event: globalThis.MouseEvent) => {
      if (bypassRef.current || event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement | null)?.closest("a")
      if (!anchor || anchor.target === "_blank") return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#")) return
      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname + url.search === window.location.pathname + window.location.search) return
      event.preventDefault()
      event.stopPropagation()
      pendingNav.current = () => navigate(url.pathname + url.search + url.hash)
      setLeaveOpen(true)
    }

    window.history.pushState({ editCompanyGuard: true }, "")
    const onPop = () => {
      if (bypassRef.current) return
      window.history.pushState({ editCompanyGuard: true }, "")
      pendingNav.current = () => navigate(companyPath)
      setLeaveOpen(true)
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    document.addEventListener("click", onClickCapture, true)
    window.addEventListener("popstate", onPop)
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload)
      document.removeEventListener("click", onClickCapture, true)
      window.removeEventListener("popstate", onPop)
    }
  }, [isDirty, navigate, companyPath])

  const setField = (key: keyof CompanyForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
  }

  const requestLeave = (go: () => void) => {
    if (!isDirty) {
      go()
      return
    }
    pendingNav.current = go
    setLeaveOpen(true)
  }

  const confirmLeave = () => {
    const go = pendingNav.current
    bypassRef.current = true
    setLeaveOpen(false)
    go?.()
  }

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setFieldErrors((current) => ({ ...current, logo: "El logo debe ser una imagen (JPG, PNG o WebP)" }))
      event.target.value = ""
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setFieldErrors((current) => ({ ...current, logo: "El logo no puede superar 5 MB" }))
      event.target.value = ""
      return
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setLogoFile(file)
    setLogoPreview(url)
    setRemoveLogo(false)
    setFieldErrors((current) => ({ ...current, logo: undefined }))
  }

  const clearLogo = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setLogoFile(null)
    setLogoPreview(null)
    setRemoveLogo(Boolean(company?.logoUrl))
    if (fileInputRef.current) fileInputRef.current.value = ""
    setFieldErrors((current) => ({ ...current, logo: undefined }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!id || saving) return

    const errors = validateForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setSaving(true)
      let logoUrl: string | null | undefined
      if (logoFile) {
        const uploaded = await fileGalleryService.uploadFile("Company", id, logoFile, { category: "Logo" })
        logoUrl = uploaded.url
      } else if (removeLogo) {
        logoUrl = null
      }

      const updated = await companyService.update(id, {
        name: form.name.trim(),
        legalName: form.legalName.trim(),
        taxId: form.taxId.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
      })

      bypassRef.current = true
      success("La información de la empresa se guardó correctamente")
      navigate(`/project-management/empresa/${updated.id}`)
    } catch (err: any) {
      const apiFields = err?.fields as FieldErrors | undefined
      if (apiFields && Object.keys(apiFields).length > 0) setFieldErrors(apiFields)
      toastError(err?.error || err?.message || "No se pudieron guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PmAppShell active="Proyectos">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d9772f] border-t-transparent" />
            <p className="text-sm font-semibold text-[#4e5558]">Cargando información de la empresa...</p>
          </div>
        </div>
      </PmAppShell>
    )
  }

  if (loadError || !company) {
    return (
      <PmAppShell active="Proyectos">
        <div className="rounded-xl border border-[#edb6a5] bg-[#fff0eb] p-4 text-sm font-semibold text-[#a84730]">
          {loadError || "No se encontró la empresa"}
        </div>
      </PmAppShell>
    )
  }

  return (
    <PmAppShell
      active="Proyectos"
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span>{" "}
          <strong className="text-[#111416]">{company.name}</strong>
        </>
      }
    >
      <div className="mb-4">
        <button
          type="button"
          onClick={() => requestLeave(() => navigate(companyPath))}
          className="flex items-center gap-2 text-[11px] font-bold text-[#b9561d] transition-colors hover:text-[#111416]"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a la empresa
        </button>
      </div>

      <ErpPageHeader
        eyebrow="Empresa / Configuración"
        title="Editar información de la empresa"
        copy={`Estás editando ${company.name}. Los cambios se guardan solo cuando confirmas.`}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-4 pb-8">
        <Section
          title="Información general"
          copy="Nombre con el que se identifica la empresa en el sistema y el logo que se muestra en sus proyectos."
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0">
              <p className="mb-1.5 text-[12px] font-semibold text-[#111416]">Logo</p>
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-[#d8d0c4] bg-[#f5f0e8]/50">
                {logoPreview ? (
                  <img src={logoPreview} alt={`Logo de ${company.name}`} className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-[#8d918f]" />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 rounded-lg border-[#d8d0c4] bg-[#fffdf9] px-2.5 text-xs font-bold text-[#111416] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60"
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Cambiar logo
                </Button>
                {(logoPreview || company.logoUrl) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearLogo}
                    className="h-8 rounded-lg border-[#d8d0c4] bg-[#fffdf9] px-2.5 text-xs font-bold text-[#4e5558] hover:border-[#edb6a5] hover:bg-[#fff0eb] hover:text-[#a84730]"
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Quitar
                  </Button>
                )}
              </div>
              <p className="mt-2 max-w-[12rem] text-[11px] leading-4 text-[#4e5558]">JPG, PNG o WebP. Máximo 5 MB.</p>
              {fieldErrors.logo && (
                <p role="alert" className="mt-1 text-xs font-medium text-[#a84730]">
                  {fieldErrors.logo}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleLogoChange}
                className="sr-only"
              />
            </div>

            <div className="min-w-0 flex-1">
              <Field id="company-name" label="Nombre de la empresa" required error={fieldErrors.name}>
                <input
                  id="company-name"
                  value={form.name}
                  onChange={setField("name")}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "company-name-error" : undefined}
                  className={inputClass(Boolean(fieldErrors.name))}
                  autoComplete="organization"
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section
          title="Información fiscal"
          copy="Datos legales registrados para esta empresa."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="company-legal-name" label="Razón social" error={fieldErrors.legalName}>
              <input
                id="company-legal-name"
                value={form.legalName}
                onChange={setField("legalName")}
                className={inputClass(Boolean(fieldErrors.legalName))}
              />
            </Field>
            <Field id="company-tax-id" label="Identificación fiscal (RIF)" error={fieldErrors.taxId}>
              <input
                id="company-tax-id"
                value={form.taxId}
                onChange={setField("taxId")}
                aria-invalid={Boolean(fieldErrors.taxId)}
                aria-describedby={fieldErrors.taxId ? "company-tax-id-error" : undefined}
                placeholder="J-12345678-9"
                className={inputClass(Boolean(fieldErrors.taxId))}
              />
            </Field>
          </div>
        </Section>

        <Section title="Información de contacto" copy="Correo y teléfono de la empresa.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="company-email" label="Correo electrónico" error={fieldErrors.email}>
              <input
                id="company-email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={setField("email")}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "company-email-error" : undefined}
                autoComplete="email"
                className={inputClass(Boolean(fieldErrors.email))}
              />
            </Field>
            <Field id="company-phone" label="Teléfono" error={fieldErrors.phone}>
              <input
                id="company-phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={setField("phone")}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "company-phone-error" : undefined}
                autoComplete="tel"
                className={inputClass(Boolean(fieldErrors.phone))}
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Ubicación"
          copy="Dirección registrada. Si al crear la empresa se indicaron ciudad, estado o código postal, quedaron incluidos en este texto."
        >
          <Field id="company-address" label="Dirección" error={fieldErrors.address}>
            <textarea
              id="company-address"
              value={form.address}
              onChange={setField("address")}
              rows={3}
              className={`${inputClass(Boolean(fieldErrors.address))} h-auto py-2`}
            />
          </Field>
        </Section>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => requestLeave(() => navigate(companyPath))}
            className="h-10 rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-10 rounded-lg border border-[#d9772f] bg-[#d9772f] text-white hover:border-[#b9561d] hover:bg-[#b9561d]"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <ErpModal
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        eyebrow="Empresa / Cambios sin guardar"
        title="Salir sin guardar"
        description="Tienes cambios que todavía no se guardaron. Si sales ahora, se van a perder."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLeaveOpen(false)}
              className="w-full rounded-lg border-[#d8d0c4] bg-[#fffdf9] text-[#4e5558] hover:border-[#b9561d] hover:bg-[#f5f0e8]/60 hover:text-[#111416] sm:w-auto"
            >
              Seguir editando
            </Button>
            <Button
              type="button"
              onClick={confirmLeave}
              className="w-full rounded-lg border border-[#111416] bg-[#111416] text-white hover:opacity-90 sm:w-auto"
            >
              Salir sin guardar
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#4e5558]">
          La ficha de <span className="font-semibold text-[#111416]">{company.name}</span> se mantiene como está hasta que guardes.
        </p>
      </ErpModal>
    </PmAppShell>
  )
}
