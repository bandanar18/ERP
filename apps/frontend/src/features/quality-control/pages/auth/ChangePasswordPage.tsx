import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth.api";
import { toast } from "sonner";
import { QcAppShell } from "../../components/QcAppShell";
import { PasswordRequirement } from "@/components/PasswordRequirement";
import { cn } from "@/lib/utils";

/* ---------- Reglas de contraseña (iguales a las del registro) ---------- */
const UPPER_RE = /[A-ZÁÉÍÓÚÑ]/;
const SPECIAL_RE = /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/;

type FieldName = "currentPassword" | "password" | "confirmPassword";

const FIELD_LABELS: Record<FieldName, string> = {
  currentPassword: "Contraseña actual",
  password: "Nueva contraseña",
  confirmPassword: "Repetir contraseña",
};

export function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<FieldName, boolean>>({
    currentPassword: false,
    password: false,
    confirmPassword: false,
  });
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);
  const [show, setShow] = useState<Record<FieldName, boolean>>({
    currentPassword: false,
    password: false,
    confirmPassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const setField = (field: FieldName) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: false }));
    if (field === "currentPassword") setCurrentError(null);
    if (field === "password") setNewError(null);
  };
  const toggleShow = (field: FieldName) => () => setShow((s) => ({ ...s, [field]: !s[field] }));

  /* ----- Evaluación en vivo de la nueva contraseña ----- */
  const passwordTouched = form.password.length > 0;
  const confirmTouched = form.confirmPassword.length > 0;
  const pw = {
    lengthOk: form.password.length >= 8,
    upperOk: UPPER_RE.test(form.password),
    specialOk: SPECIAL_RE.test(form.password),
    matchOk: confirmTouched && form.password === form.confirmPassword,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = {
      currentPassword: form.currentPassword.length === 0,
      password: !pw.lengthOk || !pw.upperOk || !pw.specialOk,
      confirmPassword: !pw.matchOk,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsLoading(true);
    try {
      await authApi.changePassword(form.currentPassword, form.password);
      setIsSuccess(true);
    } catch (err: any) {
      const message = err.message || "No se pudo cambiar la contraseña";
      // El backend distingue "La nueva contraseña debe ser diferente a la actual"
      // (error sobre el campo NUEVA) del resto (errores sobre la actual).
      if (message.includes("diferente")) {
        setNewError(message);
        setErrors((prev) => ({ ...prev, password: true }));
      } else {
        setCurrentError(message);
        setErrors((prev) => ({ ...prev, currentPassword: true }));
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (invalid?: boolean) =>
    cn(
      "h-11 w-full rounded-lg border bg-white pl-[14px] pr-[44px] text-[15px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] disabled:opacity-60",
      invalid ? "border-[#d92d20]" : "border-[#d8e6de]"
    );
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-[#101f19]";
  const errorMsgClass = "mt-1 ml-1 block text-[11px] font-semibold text-[#d92d20]";
  const eyeBtnClass =
    "absolute right-[13px] top-1/2 z-[2] grid size-[25px] -translate-y-1/2 place-items-center border-0 bg-transparent p-0 text-[#5b7267] transition-colors duration-200 hover:text-[#047857] disabled:opacity-60";

  const statusProps = (ok: boolean, touched: boolean) => ({
    ok,
    touched,
    okClass: "font-extrabold text-[#047857]",
    failClass: "font-bold text-[#d92d20]",
    idleClass: "text-[#5b7267]",
  });

  return (
    <QcAppShell
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span> <strong>Seguridad</strong>
        </>
      }
    >
      <div className="mx-auto max-w-[520px]">
        {/* Cabecera */}
        <div className="mb-5 text-center">
          <p className="mb-[4px] text-[9px] font-bold uppercase tracking-[0.16em] text-[#047857]">
            Seguridad de la cuenta
          </p>
          <h1
            id="qc-page-title"
            className="font-display mb-1 text-[clamp(28px,3vw,40px)] font-normal leading-[0.9] tracking-[0.01em] text-[#101f19]"
          >
            Cambiar contraseña
          </h1>
          <p className="text-[11px] text-[#5b7267]">
            Introduce tu contraseña actual y una nueva para completar el proceso.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-[#dce8e0] bg-white p-6 shadow-[0_24px_50px_rgba(6,40,28,0.1)] max-[600px]:p-5"
        >
          {isSuccess ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-[15px] grid size-16 place-items-center rounded-full bg-[#059669]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-[34px]"
                >
                  <path d="m20 6-11 11-5-5" />
                </svg>
              </div>
              <h2 className="font-display mb-2 text-[28px] font-normal tracking-[0.01em] text-[#101f19]">
                ¡Contraseña actualizada!
              </h2>
              <p className="mb-5 text-[13px] leading-[1.5] text-[#5b7267]">
                Tu contraseña se cambió correctamente.
              </p>
              <Link
                to="/quality-control"
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#059669] px-[15px] text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#047857]"
              >
                <LogIn className="h-4 w-4" />
                Volver al panel
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3 border-b border-[#eef4f0] pb-5">
                <div className="grid size-11 place-items-center rounded-lg bg-[#ecfdf5]">
                  <KeyRound className="h-5 w-5 text-[#047857]" />
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#047857]">
                    Credenciales
                  </div>
                  <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#101f19]">
                    Actualiza tu clave de acceso
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {(Object.keys(FIELD_LABELS) as FieldName[]).map((field) => (
                  <div key={field} className="mb-4">
                    <label htmlFor={`qc-${field}`} className={labelClass}>
                      {FIELD_LABELS[field]}
                    </label>
                    <div className="relative">
                      <input
                        id={`qc-${field}`}
                        name={field}
                        type={show[field] ? "text" : "password"}
                        autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                        required
                        value={form[field]}
                        onChange={setField(field)}
                        disabled={isLoading}
                        className={inputClass(errors[field])}
                      />
                      <button
                        type="button"
                        onClick={toggleShow(field)}
                        aria-label={show[field] ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={show[field]}
                        disabled={isLoading}
                        className={eyeBtnClass}
                      >
                        {show[field] ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                    {errors[field] && (
                      <span className={errorMsgClass}>
                        {field === "currentPassword" && (currentError || "Ingresa tu contraseña actual")}
                        {field === "password" && (newError || "La contraseña no cumple los requisitos.")}
                        {field === "confirmPassword" && "Las contraseñas no coinciden."}
                      </span>
                    )}
                  </div>
                ))}

                {/* Evaluación en vivo de la nueva contraseña */}
                <div
                  aria-live="polite"
                  className="-mt-[5px] mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] leading-[1.5]"
                >
                  <PasswordRequirement {...statusProps(pw.lengthOk, passwordTouched)} label="8 caracteres" />
                  <PasswordRequirement {...statusProps(pw.upperOk, passwordTouched)} label="mayúscula" />
                  <PasswordRequirement {...statusProps(pw.specialOk, passwordTouched)} label="carácter especial" />
                  <PasswordRequirement {...statusProps(pw.matchOk, confirmTouched)} label="coinciden" />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="min-h-[44px] w-full rounded-lg bg-[#059669] px-[15px] text-[14px] font-bold text-white transition-colors hover:bg-[#047857] disabled:opacity-70"
                >
                  {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
                </button>
              </form>

              <Link
                to="/quality-control"
                className="mt-4 block text-center text-[13px] font-bold text-[#047857] no-underline hover:underline"
              >
                Volver al panel
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </QcAppShell>
  );
}
