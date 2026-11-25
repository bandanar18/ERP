import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "../../api/auth.api";
import { toast } from "sonner";
import { QcAuthLogo } from "./QcAuthLogo";

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

/* ---------- Ilustración del diseño: sobre con llave ---------- */
function MailKeyIllustration() {
  return (
    <svg viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sobre */}
      <rect x="78" y="65" width="265" height="170" rx="18" fill="#fff" stroke="#059669" strokeWidth="4" />
      <path d="M82 76 210 175 338 76" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m82 224 94-84M338 224l-94-84" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />

      {/* Llave dentro del sobre */}
      <circle cx="152" cy="122" r="16" fill="#ecfdf5" stroke="#059669" strokeWidth="4" />
      <rect x="164" y="115" width="72" height="14" rx="7" fill="#34d399" />
      <rect x="224" y="115" width="10" height="18" rx="3" fill="#059669" />
      <rect x="210" y="115" width="10" height="18" rx="3" fill="#059669" />
      <rect x="196" y="115" width="10" height="18" rx="3" fill="#059669" />
      <circle cx="152" cy="122" r="6" fill="#059669" />

      {/* Decoración */}
      <circle cx="55" cy="68" r="8" fill="#34d399" />
      <circle cx="370" cy="222" r="10" fill="#059669" opacity=".6" />
      <path d="M47 180h18M56 171v18" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="210" cy="255" rx="125" ry="9" fill="#059669" opacity=".14" />
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  /* ----- Cuenta regresiva antes de volver al login ----- */
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
    if (isSuccess && countdown === 0) {
      navigate("/quality-control/login");
    }
  }, [isSuccess, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailInvalid(true);
      return;
    }
    setEmailInvalid(false);

    setIsLoading(true);
    try {
      await authApi.requestPasswordReset(trimmed);
      setIsSuccess(true);
      setCountdown(10);
    } catch (err: any) {
      toast.error(err.message || "No se pudo enviar el email");
    } finally {
      setIsLoading(false);
    }
  };

  /* ----- Clases compartidas (paleta verde QC) ----- */
  const inputClass = (invalid?: boolean) =>
    `h-11 w-full rounded-[8px] border bg-white px-[14px] text-[15px] font-medium text-[#101f19] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#9db0a5] focus:border-[#059669] focus:shadow-[0_0_0_3px_rgba(5,150,105,0.12)] disabled:opacity-60 ${
      invalid ? "border-[#d92d20]" : "border-[#d8e6de]"
    }`;
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-[#101f19]";
  const errorMsgClass = "mt-1 ml-1 block text-[11px] font-semibold text-[#d92d20]";
  const btnPrimaryClass =
    "mt-1 min-h-[44px] w-full rounded-[8px] bg-[#059669] px-[15px] py-[13px] text-[15px] font-bold text-white transition-[background-color,transform,opacity] duration-200 hover:-translate-y-px hover:bg-[#047857] disabled:translate-y-0 disabled:opacity-70";

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
            aria-label="Recuperar contraseña"
            className="order-1 mx-auto w-[480px] max-w-full -translate-x-[180px] text-center max-[1050px]:translate-x-0"
          >
            <div className="relative mx-auto mb-[12px] w-[250px] max-w-full">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[84px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_55%_45%/55%_45%_55%_45%] bg-[#059669] opacity-20 max-[600px]:h-[76px] max-[600px]:w-[135px]"
              />
              <div className="relative mx-auto w-[215px] max-w-full max-[600px]:w-[180px]">
                <MailKeyIllustration />
              </div>
            </div>

            <h2 className="mx-auto mb-2 w-[400px] max-w-full text-center text-[clamp(27px,3.4vw,38px)] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#101f19] max-[600px]:text-[28px]">
              Recupera tu cuenta y
              <br />
              <mark className="inline-block rounded-[5px] bg-white px-[7px] pb-[2px] pt-[1px] leading-[0.95] text-[#101f19]">
                vuelve a gestionar
              </mark>
            </h2>

            <p className="mx-auto w-[400px] max-w-full text-center text-[15px] leading-[1.45] text-[#5b7267] max-[600px]:text-[15px]">
              Ingresa tu email y te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>
          </section>

          {/* Tarjeta de recuperación */}
          <div className="order-2 mx-auto max-[600px]:w-full">
            <section
              aria-labelledby="qc-forgot-title"
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
                  <h2 className="mb-2 text-[22px] font-extrabold text-[#101f19]">¡Revisa tu correo!</h2>
                  <p className="mb-5 text-[13px] leading-[1.5] text-[#5b7267]">
                    Si el email está registrado, recibirás un enlace para restablecer tu
                    contraseña. Revisa también spam.
                  </p>
                  <p className="mb-4 text-[12px] font-medium text-[#5b7267]">
                    Redirigiendo al login en{" "}
                    <span className="font-mono font-bold text-[#047857]">{countdown}s</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/quality-control/login")}
                    className="flex w-full items-center justify-center rounded-[8px] bg-[#059669] px-[15px] py-[13px] text-[15px] font-bold text-white transition hover:-translate-y-px hover:bg-[#047857]"
                  >
                    Volver al login ahora
                  </button>
                </motion.div>
              ) : (
                <>
                  <QcAuthLogo compact size={46} className="mx-auto mb-[9px]" />

                  <h1
                    id="qc-forgot-title"
                    className="mb-2.5 text-center text-[27px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#101f19]"
                  >
                    ¿Olvidaste tu contraseña?
                  </h1>

                  <p className="mx-auto mb-5 text-center text-[13px] leading-[1.5] text-[#5b7267]">
                    Ingresa tu email y te enviaremos un enlace para restablecerla.
                  </p>

                  <form onSubmit={handleSubmit} noValidate>
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
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailInvalid(false);
                        }}
                        disabled={isLoading}
                        className={inputClass(emailInvalid)}
                      />
                      {emailInvalid && (
                        <span className={errorMsgClass}>Ingresa un correo válido</span>
                      )}
                    </div>

                    <button type="submit" disabled={isLoading} className={btnPrimaryClass}>
                      {isLoading ? "Enviando..." : "Enviar instrucciones"}
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
