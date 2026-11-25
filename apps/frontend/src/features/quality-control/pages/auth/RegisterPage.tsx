import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { EyeOff } from "lucide-react";
import { authApi } from "../../api/auth.api";
import { toast } from "sonner";
import { QcAuthLogo } from "./QcAuthLogo";
import { PasswordRequirement } from "@/components/PasswordRequirement";

/* ---------- Íconos ---------- */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function EyeIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ---------- Ilustración del diseño: portapapeles con indicadores de calidad ---------- */
function RegisterSceneIllustration() {
  return (
    <svg viewBox="0 0 430 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="46" cy="66" r="9" fill="#34d399" />
      <circle cx="383" cy="52" r="7" fill="#059669" opacity=".55" />
      <circle cx="390" cy="239" r="11" fill="#34d399" opacity=".7" />

      {/* Portapapeles */}
      <rect x="86" y="45" width="214" height="220" rx="15" fill="#fff" stroke="#059669" strokeWidth="3" />
      <rect x="157" y="29" width="72" height="29" rx="10" fill="#059669" />
      <circle cx="193" cy="44" r="6" fill="#ecfdf5" />

      {/* Elementos del portapapeles */}
      <circle cx="119" cy="98" r="11" fill="#10b981" />
      <path d="m113 98 4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="142" y="92" width="128" height="11" rx="5" fill="#d1fae5" />

      <circle cx="119" cy="140" r="11" fill="#10b981" />
      <path d="m113 140 4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="142" y="134" width="101" height="11" rx="5" fill="#d1fae5" />

      <circle cx="119" cy="182" r="11" fill="#fff" stroke="#34d399" strokeWidth="3" />
      <circle cx="119" cy="182" r="4" fill="#34d399" />
      <rect x="142" y="176" width="115" height="11" rx="5" fill="#d1fae5" />

      <circle cx="119" cy="224" r="11" fill="#fff" stroke="#a7f3d0" strokeWidth="3" />
      <rect x="142" y="218" width="87" height="11" rx="5" fill="#e8f7ef" />

      {/* Lápiz */}
      <g transform="rotate(38 323 195)">
        <rect x="314" y="118" width="18" height="86" rx="3" fill="#34d399" />
        <rect x="314" y="118" width="18" height="14" rx="3" fill="#059669" />
        <path d="M314 204h18l-9 24-9-24Z" fill="#d1fae5" />
        <path d="M319 216h8l-4 12-4-12Z" fill="#064e3b" />
      </g>

      {/* Usuario */}
      <circle cx="337" cy="83" r="30" fill="#d1fae5" stroke="#059669" strokeWidth="3" />
      <circle cx="337" cy="73" r="11" fill="#059669" />
      <path d="M316 99q21-18 42 0-2 8-8 10h-26q-6-2-8-10Z" fill="#059669" />

      <circle cx="361" cy="57" r="11" fill="#10b981" />
      <path d="m355 57 4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Constantes del wizard ---------- */
const SUBTITLES: Record<number, string> = {
  1: "Paso 1 de 3 — Datos personales",
  2: "Paso 2 de 3 — Datos de la cuenta",
  3: "Paso 3 de 3 — Seguridad",
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
};

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

type FieldErrors = Partial<Record<keyof FormState, boolean>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{4,}$/;
const UPPER_RE = /[A-ZÁÉÍÓÚÑ]/;
const SPECIAL_RE = /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/;

export function RegisterPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameCheckRef = useRef(0);
  const navigate = useNavigate();

  const setField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: false }));
  };

  /* ----- Disponibilidad en vivo del nombre de usuario (único) ----- */
  useEffect(() => {
    const value = form.username.trim();
    if (!USERNAME_RE.test(value)) {
      setUsernameStatus("idle");
      return;
    }
    const requestId = ++usernameCheckRef.current;
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(value);
        // Solo aplica el resultado si esta es la última petición (evita
        // respuestas obsoletas sobrescribiendo el estado actual).
        if (usernameCheckRef.current === requestId) {
          setUsernameStatus(res.available ? "available" : "taken");
        }
      } catch {
        if (usernameCheckRef.current === requestId) setUsernameStatus("idle");
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [form.username]);

  /* ----- Validación por paso ----- */
  const validateStep = (step: number): boolean => {
    const next: FieldErrors = {};
    if (step === 1) {
      next.firstName = form.firstName.trim().length < 2;
      next.lastName = form.lastName.trim().length < 2;
    }
    if (step === 2) {
      next.email = !EMAIL_RE.test(form.email.trim());
      next.username = !USERNAME_RE.test(form.username.trim()) || usernameStatus === "taken";
      // Aún verificando disponibilidad: bloquea el avance sin marcar error
      // (se muestra el mensaje "Verificando disponibilidad…").
      if (!next.email && !next.username && usernameStatus === "checking") {
        setErrors({ email: false, username: false });
        return false;
      }
    }
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  /* ----- Evaluación en vivo de la contraseña ----- */
  const passwordTouched = form.password.length > 0;
  const confirmTouched = form.confirmPassword.length > 0;
  const pw = {
    lengthOk: form.password.length >= 8,
    upperOk: UPPER_RE.test(form.password),
    specialOk: SPECIAL_RE.test(form.password),
    matchOk: confirmTouched && form.password === form.confirmPassword,
  };

  const next = () => {
    if (validateStep(currentStep)) setCurrentStep((s) => Math.min(s + 1, 3));
  };
  const back = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return;

    setErrors({
      password: !pw.lengthOk || !pw.upperOk || !pw.specialOk,
      confirmPassword: !pw.matchOk,
    });
    if (!pw.lengthOk || !pw.upperOk || !pw.specialOk || !pw.matchOk) return;

    setIsLoading(true);
    try {
      await authApi.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "No se pudo crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  /* ----- Clases compartidas (paleta verde QC) ----- */
  const inputClass = (invalid?: boolean, withEye = false, valid = false) =>
    `h-11 w-full rounded-[10px] border bg-white text-[15px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] disabled:opacity-60 ${
      withEye ? "pl-[15px] pr-[44px]" : "px-[15px]"
    } ${invalid ? "border-[#d92d20]" : valid ? "border-[#34d399]" : "border-[#d8e6de]"}`;

  const labelClass = "mb-1.5 block text-[13px] font-semibold text-[#101f19]";
  const errorMsgClass = "mt-1 ml-1 block text-[11px] font-semibold text-[#d92d20]";
  const eyeBtnClass =
    "absolute right-[13px] top-1/2 z-[2] grid size-[25px] -translate-y-1/2 place-items-center border-0 bg-transparent p-0 text-[#5b7267] transition-colors duration-200 hover:text-[#047857] disabled:opacity-60";
  const btnPrimaryClass =
    "min-h-11 w-full rounded-[10px] bg-[#059669] px-3.5 text-[14px] font-extrabold text-white transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#047857] disabled:translate-y-0 disabled:opacity-70";
  const btnBackClass =
    "min-h-11 flex-[0_0_100px] rounded-[10px] border-2 border-[#d8e6de] bg-white px-3.5 text-[14px] font-extrabold text-[#101f19] transition-colors duration-200 hover:border-[#101f19]";

  const statusProps = (ok: boolean, touched: boolean) => ({
    ok,
    touched,
    okClass: "font-extrabold text-[#047857]",
    failClass: "font-bold text-[#d92d20]",
    idleClass: "text-[#5b7267]",
  });

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-white text-[#101f19]">
      <main className="relative grid min-h-0 flex-1 place-items-center overflow-hidden px-14 pb-[34px] pt-[76px] max-[1000px]:overflow-visible max-[1000px]:px-6 max-[1000px]:pb-[35px] max-[1000px]:pt-[82px] max-[600px]:px-[15px] max-[600px]:pb-6 max-[600px]:pt-[64px]">
        {/* Zona verde diagonal (se conserva a la izquierda) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(225deg,transparent_0_54%,#059669_54%_100%)]"
        />
        {/* Acento diagonal más oscuro sobre la zona verde */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-[linear-gradient(225deg,transparent_30%,#047857_30%_46%,transparent_46%)] opacity-[0.42]"
        />

        {/* Marca */}
        <Link
          to="/quality-control/login"
          aria-label="Business & Development — Venezuela"
          className="absolute right-14 top-6 z-10 max-[1000px]:right-6 max-[600px]:right-auto max-[600px]:left-[18px] max-[600px]:top-5"
        >
          <QcAuthLogo />
        </Link>

        <div className="relative z-[2] grid w-[min(1180px,100%)] grid-cols-[420px_minmax(0,1fr)] items-center gap-[clamp(32px,5vw,64px)] max-[1000px]:grid-cols-1 max-[1000px]:gap-[38px]">
          {/* Tarjeta de registro */}
          <section
            aria-labelledby="qc-register-title"
            className="order-1 w-[420px] max-w-full rounded-[20px] bg-white p-[27px_36px_24px] shadow-[0_24px_55px_rgba(6,40,28,0.27)] max-[1000px]:mx-auto max-[600px]:w-full max-[600px]:p-[25px_21px_21px]"
          >
            <QcAuthLogo compact size={42} className="mx-auto mb-2" />
            <h1
              id="qc-register-title"
              className="text-center text-[27px] font-extrabold leading-[1.2] tracking-[-0.035em] text-[#101f19]"
            >
              Crear cuenta
            </h1>

            {isSuccess ? (
              <div className="pt-5 text-center">
                <div className="mx-auto mb-[13px] grid size-[62px] place-items-center rounded-full bg-[#059669]">
                  <CheckIcon className="size-8 text-white" />
                </div>
                <h2 className="mb-1.5 text-[21px] font-extrabold text-[#101f19]">¡Cuenta creada!</h2>
                <p className="mb-[17px] text-[13px] text-[#5b7267]">
                  Tu registro se completó exitosamente.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/quality-control/verify?email=${encodeURIComponent(form.email.trim())}`)}
                  className="block w-full rounded-[10px] bg-[#059669] py-3.5 text-[14px] font-extrabold text-white transition hover:-translate-y-px hover:bg-[#047857]"
                >
                  Verificar mi email
                </button>
              </div>
            ) : (
              <>
                <p className="mb-[13px] mt-[5px] text-center text-[12px] font-semibold text-[#5b7267]">
                  {SUBTITLES[currentStep]}
                </p>

                {/* Barra de pasos */}
                <div className="mb-[15px] flex h-[31px] items-center justify-center">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <span
                        className={`grid size-[31px] place-items-center rounded-full border-2 text-[12px] font-extrabold transition-all duration-200 ${
                          step === currentStep
                            ? "border-[#059669] bg-[#059669] text-white"
                            : step < currentStep
                              ? "border-[#34d399] bg-[#34d399] text-white"
                              : "border-[#d8e6de] bg-white text-[#5b7267]"
                        }`}
                      >
                        {step < currentStep ? <CheckIcon className="size-[13px] text-white" /> : step}
                      </span>
                      {step < 3 && (
                        <span
                          aria-hidden="true"
                          className={`h-0.5 w-[42px] transition-colors duration-200 ${
                            step < currentStep ? "bg-[#34d399]" : "bg-[#d8e6de]"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div key={currentStep} className="min-h-[190px]">
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      {/* PASO 1 — Datos personales */}
                      {currentStep === 1 && (
                        <>
                          <div className="mb-4">
                            <label htmlFor="qc-firstName" className={labelClass}>
                              Nombre
                            </label>
                            <input
                              id="qc-firstName"
                              name="firstName"
                              type="text"
                              autoComplete="given-name"
                              placeholder="Tu nombre"
                              required
                              value={form.firstName}
                              onChange={setField("firstName")}
                              disabled={isLoading}
                              className={inputClass(errors.firstName)}
                            />
                            {errors.firstName && <span className={errorMsgClass}>Ingresa tu nombre</span>}
                          </div>

                          <div className="mb-4">
                            <label htmlFor="qc-lastName" className={labelClass}>
                              Apellido
                            </label>
                            <input
                              id="qc-lastName"
                              name="lastName"
                              type="text"
                              autoComplete="family-name"
                              placeholder="Tu apellido"
                              required
                              value={form.lastName}
                              onChange={setField("lastName")}
                              disabled={isLoading}
                              className={inputClass(errors.lastName)}
                            />
                            {errors.lastName && <span className={errorMsgClass}>Ingresa tu apellido</span>}
                          </div>

                          <div className="mt-[7px] flex gap-2.5">
                            <button type="button" onClick={next} className={btnPrimaryClass}>
                              Siguiente
                            </button>
                          </div>
                        </>
                      )}

                      {/* PASO 2 — Datos de la cuenta */}
                      {currentStep === 2 && (
                        <>
                          <div className="mb-4">
                            <label htmlFor="qc-email" className={labelClass}>
                              Correo electrónico
                            </label>
                            <input
                              id="qc-email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              placeholder="nombre@ejemplo.com"
                              required
                              value={form.email}
                              onChange={setField("email")}
                              disabled={isLoading}
                              className={inputClass(errors.email)}
                            />
                            {errors.email && <span className={errorMsgClass}>Ingresa un correo válido</span>}
                          </div>

                          <div className="mb-4">
                            <label htmlFor="qc-username" className={labelClass}>
                              Nombre de usuario
                            </label>
                            <input
                              id="qc-username"
                              name="username"
                              type="text"
                              autoComplete="username"
                              placeholder="usuario_2026"
                              required
                              value={form.username}
                              onChange={setField("username")}
                              disabled={isLoading}
                              className={inputClass(errors.username, false, usernameStatus === "available")}
                            />
                            {usernameStatus === "taken" && (
                              <span className={errorMsgClass}>Ese nombre de usuario ya está en uso</span>
                            )}
                            {!errors.username && usernameStatus === "checking" && (
                              <span className="mt-1 ml-1 block text-[11px] font-semibold text-[#5b7267]">
                                Verificando disponibilidad…
                              </span>
                            )}
                            {!errors.username && usernameStatus === "available" && (
                              <span className="mt-1 ml-1 flex items-center gap-1 text-[11px] font-semibold text-[#047857]">
                                <CheckIcon className="size-3.5 text-[#047857]" />
                                Nombre de usuario disponible
                              </span>
                            )}
                            {errors.username && usernameStatus !== "taken" && (
                              <span className={errorMsgClass}>Mínimo 4 caracteres, sin espacios</span>
                            )}
                          </div>

                          <div className="mt-[7px] flex gap-2.5">
                            <button type="button" onClick={back} className={btnBackClass}>
                              Atrás
                            </button>
                            <button type="button" onClick={next} className={btnPrimaryClass}>
                              Siguiente
                            </button>
                          </div>
                        </>
                      )}

                      {/* PASO 3 — Seguridad */}
                      {currentStep === 3 && (
                        <>
                          <div className="mb-4">
                            <label htmlFor="qc-password" className={labelClass}>
                              Contraseña
                            </label>
                            <div className="relative">
                              <input
                                id="qc-password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                required
                                value={form.password}
                                onChange={setField("password")}
                                disabled={isLoading}
                                className={inputClass(errors.password, true)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                aria-pressed={showPassword}
                                disabled={isLoading}
                                className={eyeBtnClass}
                              >
                                {showPassword ? <EyeOff size={19} /> : <EyeIcon size={19} />}
                              </button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label htmlFor="qc-confirmPassword" className={labelClass}>
                              Repetir contraseña
                            </label>
                            <div className="relative">
                              <input
                                id="qc-confirmPassword"
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                autoComplete="new-password"
                                placeholder="••••••••"
                                required
                                value={form.confirmPassword}
                                onChange={setField("confirmPassword")}
                                disabled={isLoading}
                                className={inputClass(errors.confirmPassword, true)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                                aria-pressed={showConfirm}
                                disabled={isLoading}
                                className={eyeBtnClass}
                              >
                                {showConfirm ? <EyeOff size={19} /> : <EyeIcon size={19} />}
                              </button>
                            </div>
                          </div>

                          {/* Evaluación en vivo de la contraseña */}
                          <div
                            aria-live="polite"
                            className="-mt-[5px] mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-left text-[10px] leading-[1.5]"
                          >
                            <PasswordRequirement {...statusProps(pw.lengthOk, passwordTouched)} label="8 caracteres" />
                            <PasswordRequirement {...statusProps(pw.upperOk, passwordTouched)} label="mayúscula" />
                            <PasswordRequirement {...statusProps(pw.specialOk, passwordTouched)} label="carácter especial" />
                            <PasswordRequirement {...statusProps(pw.matchOk, confirmTouched)} label="coinciden" />
                          </div>

                          <div className="mt-[7px] flex gap-2.5">
                            <button type="button" onClick={back} className={btnBackClass}>
                              Atrás
                            </button>
                            <button type="submit" disabled={isLoading} className={btnPrimaryClass}>
                              {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>
                </form>

                <p className="mt-3 text-center text-[12px] text-[#5b7267]">
                  ¿Ya tienes cuenta?{" "}
                  <Link
                    to="/quality-control/login"
                    className="font-extrabold text-[#047857] no-underline hover:underline"
                  >
                    Inicia sesión
                  </Link>
                </p>
              </>
            )}
          </section>

          {/* Promoción derecha */}
          <section
            aria-label="Información del registro"
            className="order-2 relative left-[70px] w-[610px] max-w-full min-w-0 justify-self-end pt-2.5 text-center max-[1000px]:left-0 max-[1000px]:mx-auto max-[1000px]:w-[min(610px,100%)] max-[1000px]:justify-self-center"
          >
            <div className="relative mx-auto mb-[12px] w-[280px] max-w-full">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[90px] w-[175px] -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_55%_45%/55%_45%_55%_45%] bg-[#059669] opacity-[0.16] max-[600px]:h-[84px] max-[600px]:w-[160px]"
              />
              <div className="relative mx-auto w-[240px] max-w-full">
                <RegisterSceneIllustration />
              </div>
            </div>

            <h2 className="mx-auto mb-2 w-[400px] max-w-full text-center text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.03] tracking-[-0.045em] text-[#101f19] max-[600px]:text-[28px]">
              Crea tu cuenta y
              <br />
              <mark className="inline-block rounded-md bg-[#059669] px-2 pb-[1px] font-serif font-bold italic leading-[0.93] text-white">
                mide tu calidad
              </mark>
            </h2>

            <p className="mx-auto w-[400px] max-w-full text-center text-[15px] leading-[1.5] text-[#5b7267] max-[600px]:text-[15px]">
              Regístrate en tres simples pasos y toma el control de tus procesos de calidad.
            </p>
          </section>
        </div>
      </main>

      <footer className="flex items-center justify-between gap-4 bg-[#064e3b] px-10 py-3 text-[13px] font-bold text-white max-[600px]:flex-wrap max-[600px]:px-[18px]">
        <span>Business &amp; Development — Venezuela</span>
        <span className="text-[11px] font-medium text-white/60">© 2026 Todos los derechos reservados</span>
      </footer>
    </div>
  );
}
