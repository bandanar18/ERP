import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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

/* ---------- Ilustración del diseño: escudo con candado ---------- */
function LockSceneIllustration() {
  return (
    <svg viewBox="0 0 360 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Escudo */}
      <path d="M180 22 292 62v76c0 72-47 104-112 124-65-20-112-52-112-124V62L180 22Z" fill="#fff" stroke="#059669" strokeWidth="5" />
      <path d="M180 48 260 77v58c0 50-31 74-80 92-49-18-80-42-80-92V77l80-29Z" fill="#ecfdf5" />

      {/* Candado */}
      <rect x="125" y="105" width="110" height="92" rx="16" fill="#34d399" stroke="#059669" strokeWidth="4" />
      <path d="M148 105V82c0-25 14-42 32-42s32 17 32 42v23" stroke="#059669" strokeWidth="12" strokeLinecap="round" />
      <circle cx="180" cy="145" r="10" fill="#fff" />
      <rect x="175" y="145" width="10" height="25" rx="5" fill="#fff" />

      {/* Decoración */}
      <circle cx="35" cy="72" r="8" fill="#34d399" />
      <circle cx="325" cy="208" r="10" fill="#059669" opacity=".6" />
      <path d="M38 190h26M51 177v26" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
      <path d="m308 65 7 7m0-7-7 7" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Reglas de contraseña (iguales a las del registro) ---------- */
const UPPER_RE = /[A-ZÁÉÍÓÚÑ]/;
const SPECIAL_RE = /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ password: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /* ----- Sin token → volver al login (sin renderizar el form) ----- */
  useEffect(() => {
    if (!token) {
      navigate("/quality-control/login");
    }
  }, [token, navigate]);

  if (!token) return null;

  /* ----- Redirección automática tras el éxito ----- */
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => navigate("/quality-control/login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  /* ----- Evaluación en vivo de la contraseña ----- */
  const passwordTouched = password.length > 0;
  const confirmTouched = confirmPassword.length > 0;
  const pw = {
    lengthOk: password.length >= 8,
    upperOk: UPPER_RE.test(password),
    specialOk: SPECIAL_RE.test(password),
    matchOk: confirmTouched && password === confirmPassword,
  };

  const setField =
    (field: "password" | "confirmPassword") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (field === "password") setPassword(e.target.value);
      else setConfirmPassword(e.target.value);
      setErrors((err) => ({ ...err, [field]: false }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setErrors({
      password: !pw.lengthOk || !pw.upperOk || !pw.specialOk,
      confirmPassword: !pw.matchOk,
    });
    if (!pw.lengthOk || !pw.upperOk || !pw.specialOk || !pw.matchOk) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  /* ----- Clases compartidas (paleta verde QC) ----- */
  const inputClass = (invalid?: boolean, withEye = false) =>
    `h-11 w-full rounded-[8px] border bg-white text-[15px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] disabled:opacity-60 ${
      withEye ? "pl-[14px] pr-[44px]" : "px-[14px]"
    } ${invalid ? "border-[#d92d20]" : "border-[#d8e6de]"}`;
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-[#101f19]";
  const errorMsgClass = "mt-1 ml-1 block text-[11px] font-semibold text-[#d92d20]";
  const eyeBtnClass =
    "absolute right-[13px] top-1/2 z-[2] grid size-[25px] -translate-y-1/2 place-items-center border-0 bg-transparent p-0 text-[#5b7267] transition-colors duration-200 hover:text-[#047857] disabled:opacity-60";
  const btnPrimaryClass =
    "mt-1 min-h-[44px] w-full rounded-[8px] bg-[#059669] px-[15px] py-[13px] text-[15px] font-bold text-white transition-[background-color,transform,opacity] duration-200 hover:-translate-y-px hover:bg-[#047857] disabled:translate-y-0 disabled:opacity-70";

  const statusProps = (ok: boolean, touched: boolean) => ({
    ok,
    touched,
    okClass: "font-extrabold text-[#047857]",
    failClass: "font-bold text-[#d92d20]",
    idleClass: "text-[#5b7267]",
  });

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-white text-[#101f19]">
      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-14 pb-6 pt-[56px] max-[1050px]:overflow-visible max-[1050px]:px-7 max-[1050px]:pb-7 max-[1050px]:pt-[76px] max-[600px]:px-[18px] max-[600px]:pb-6 max-[600px]:pt-[64px]">
        {/* Zona verde diagonal (se conserva a la derecha) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_54%,#059669_54%,#059669_100%)]"
        />
        {/* Acento diagonal más oscuro sobre la zona verde */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[linear-gradient(135deg,transparent_30%,#047857_30%,#047857_46%,transparent_46%)] opacity-55"
        />

        {/* Marca */}
        <Link
          to="/quality-control/login"
          aria-label="Business & Development — Venezuela"
          className="absolute left-14 top-[25px] z-10 max-[1050px]:left-7 max-[600px]:left-[18px] max-[600px]:top-5"
        >
          <QcAuthLogo />
        </Link>

        <div className="relative z-[2] grid w-[min(1180px,100%)] grid-cols-[minmax(0,1fr)_380px] items-center gap-10 max-[1050px]:grid-cols-1 max-[1050px]:gap-[34px]">
          {/* Promoción izquierda, centrada en la zona blanca */}
          <section
            aria-label="Cambiar contraseña"
            className="order-1 mx-auto w-[480px] max-w-full -translate-x-[180px] text-center max-[1050px]:translate-x-0"
          >
            <div className="relative mx-auto mb-[12px] w-[250px] max-w-full">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[84px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_55%_45%/55%_45%_55%_45%] bg-[#059669] opacity-20 max-[600px]:h-[76px] max-[600px]:w-[135px]"
              />
              <div className="relative mx-auto w-[190px] max-w-full max-[600px]:w-[170px]">
                <LockSceneIllustration />
              </div>
            </div>

            <h2 className="mx-auto mb-2 w-[400px] max-w-full text-center text-[clamp(27px,3.4vw,38px)] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#101f19] max-[600px]:text-[28px]">
              Recupera el acceso y
              <br />
              <mark className="inline-block rounded-[5px] bg-white px-[7px] pb-[2px] pt-[1px] leading-[0.95] text-[#101f19]">
                protege tu cuenta
              </mark>
            </h2>

            <p className="mx-auto w-[400px] max-w-full text-center text-[15px] leading-[1.45] text-[#5b7267] max-[600px]:text-[15px]">
              Crea una nueva contraseña segura para volver a utilizar tu cuenta.
            </p>
          </section>

          {/* Tarjeta de cambio de contraseña */}
          <div className="order-2 mx-auto max-[600px]:w-full">
            <section
              aria-labelledby="qc-password-title"
              className="w-[380px] max-w-full rounded-[18px] bg-white p-[26px_28px_22px] shadow-[0_24px_50px_rgba(6,40,28,0.25)] max-[600px]:w-full max-[600px]:p-[27px_22px_23px]"
            >
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pt-2 text-center"
                >
                  <div className="mx-auto mb-[15px] mt-0.5 grid size-16 place-items-center rounded-full bg-[#059669]">
                    <CheckIcon className="size-[34px] text-white" />
                  </div>
                  <h2 className="mb-2 text-[22px] font-extrabold text-[#101f19]">¡Contraseña actualizada!</h2>
                  <p className="mb-5 text-[13px] leading-[1.5] text-[#5b7267]">
                    Tu contraseña se cambió correctamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quality-control/login")}
                    className="flex w-full items-center justify-center rounded-[8px] bg-[#059669] px-[15px] py-[13px] text-[15px] font-bold text-white no-underline transition hover:-translate-y-px hover:bg-[#047857]"
                  >
                    Ir a iniciar sesión
                  </button>
                </motion.div>
              ) : (
                <>
                  <QcAuthLogo compact size={46} className="mx-auto mb-[9px]" />

                  <h1
                    id="qc-password-title"
                    className="mb-2.5 text-center text-[27px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#101f19]"
                  >
                    Cambiar contraseña
                  </h1>

                  <p className="mx-auto mb-5 text-center text-[13px] leading-[1.5] text-[#5b7267]">
                    Introduce tu nueva contraseña y confírmala para completar el proceso.
                  </p>

                  <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                      <label htmlFor="qc-password" className={labelClass}>
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="qc-password"
                          name="newPassword"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={password}
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
                      {errors.password && (
                        <span className={errorMsgClass}>La contraseña no cumple los requisitos.</span>
                      )}
                    </div>

                    <div className="mb-4">
                      <label htmlFor="qc-confirmPassword" className={labelClass}>
                        Repetir contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="qc-confirmPassword"
                          name="repeatPassword"
                          type={showConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={confirmPassword}
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
                      {errors.confirmPassword && (
                        <span className={errorMsgClass}>Las contraseñas no coinciden.</span>
                      )}
                    </div>

                    {/* Evaluación en vivo de la contraseña */}
                    <div
                      aria-live="polite"
                      className="-mt-[5px] mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] leading-[1.5]"
                    >
                      <PasswordRequirement {...statusProps(pw.lengthOk, passwordTouched)} label="8 caracteres" />
                      <PasswordRequirement {...statusProps(pw.upperOk, passwordTouched)} label="mayúscula" />
                      <PasswordRequirement {...statusProps(pw.specialOk, passwordTouched)} label="carácter especial" />
                      <PasswordRequirement {...statusProps(pw.matchOk, confirmTouched)} label="coinciden" />
                    </div>

                    <button type="submit" disabled={isLoading} className={btnPrimaryClass}>
                      {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
                    </button>
                  </form>

                  <Link
                    to="/quality-control/login"
                    className="mt-4 block text-center text-[13px] font-bold text-[#047857] no-underline hover:underline"
                  >
                    Volver a iniciar sesión
                  </Link>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between gap-4 bg-[#064e3b] px-9 py-3 text-[13px] font-semibold text-white max-[600px]:flex-wrap max-[600px]:px-[18px]">
        <span>Business &amp; development — Venezuela</span>
        <span className="text-[11px] font-normal text-white/60">© 2026 Todos los derechos reservados</span>
      </footer>
    </div>
  );
}
