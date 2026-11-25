import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { authApi } from "../../api/auth.api"
import { BrandLogo } from "./BrandLogo"

const CODE_LENGTH = 6
// Sincronizado con el backend (pm-otp.service.ts: OTP_EXPIRY_SECONDS = 300).
const OTP_EXPIRY_SECONDS = 300

/* ---------- Ícono de check (panel de éxito) ---------- */
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
  )
}

/* ---------- Ilustración del diseño: sobre con código y escudo ---------- */
function OtpEnvelopeIllustration() {
  return (
    <svg viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sobre */}
      <rect x="78" y="65" width="265" height="170" rx="18" fill="#fff" stroke="#ea580c" strokeWidth="4" />
      <path d="M82 76 210 175 338 76" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m82 224 94-84M338 224l-94-84" stroke="#fb923c" strokeWidth="4" strokeLinecap="round" />

      {/* Código dentro del sobre */}
      <rect x="128" y="112" width="164" height="48" rx="10" fill="#fff7ed" stroke="#fb923c" strokeWidth="2" />
      <circle cx="151" cy="136" r="6" fill="#ea580c" />
      <circle cx="177" cy="136" r="6" fill="#ea580c" />
      <circle cx="203" cy="136" r="6" fill="#ea580c" />
      <circle cx="229" cy="136" r="6" fill="#ea580c" />
      <circle cx="255" cy="136" r="6" fill="#ea580c" />
      <circle cx="281" cy="136" r="6" fill="#ea580c" />

      {/* Escudo de seguridad */}
      <path d="M326 38 365 53v32c0 27-17 44-39 54-22-10-39-27-39-54V53l39-15Z" fill="#fb923c" stroke="#ea580c" strokeWidth="3" />
      <path d="m307 82 12 12 25-27" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      {/* Elementos decorativos */}
      <circle cx="55" cy="68" r="8" fill="#fb923c" />
      <circle cx="370" cy="222" r="10" fill="#ea580c" opacity=".6" />
      <path d="M47 180h18M56 171v18" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="210" cy="255" rx="125" ry="9" fill="#ea580c" opacity=".14" />
    </svg>
  )
}

export function VerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const email = (searchParams.get("email") || "").trim()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
  const [invalid, setInvalid] = useState<boolean[]>(Array(CODE_LENGTH).fill(false))
  const [shaking, setShaking] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null)

  const expired = secondsLeft <= 0
  const code = digits.join("")

  /* ----- Cuenta regresiva ----- */
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  /* ----- Redirección automática tras verificar ----- */
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => navigate("/project-management/login"), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, navigate])

  /* ----- Autofocus al primer dígito ----- */
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const showMessage = (text: string, type: "error" | "success") => setMessage({ text, type })

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0")
    const remaining = (seconds % 60).toString().padStart(2, "0")
    return `${minutes}:${remaining}`
  }

  /* ----- Manejo de los 6 inputs ----- */
  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(0, 1)
    setDigits((d) => {
      const next = [...d]
      next[index] = digit
      return next
    })
    setInvalid((v) => {
      const next = [...v]
      next[index] = false
      return next
    })
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
    if (!pasted) return

    setDigits((d) => {
      const next = [...d]
      pasted.split("").forEach((digit, i) => {
        next[i] = digit
      })
      return next
    })

    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  const triggerShake = () => {
    setShaking(false)
    // Fuerza el reinicio de la animación en el siguiente frame
    requestAnimationFrame(() => setShaking(true))
  }

  /* ----- Enviar código ----- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSuccess) return

    const empty = digits.map((digit) => !digit)
    if (empty.some(Boolean)) {
      setInvalid(empty)
      triggerShake()
      showMessage("Introduce los 6 dígitos del código.", "error")
      return
    }

    if (expired) {
      triggerShake()
      showMessage("El código expiró. Solicita uno nuevo.", "error")
      return
    }

    if (!email) {
      showMessage("No se encontró el correo. Vuelve al registro.", "error")
      return
    }

    setIsLoading(true)
    try {
      const result = await authApi.verifyOtp(email, code)
      if (result.verified) {
        setIsSuccess(true)
      }
    } catch (err: any) {
      triggerShake()
      showMessage(err.message || "Código inválido o expirado.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  /* ----- Reenviar código ----- */
  const handleResend = async () => {
    if (!expired || isLoading) return

    if (!email) {
      showMessage("No se encontró el correo. Vuelve al registro.", "error")
      return
    }

    setIsLoading(true)
    try {
      await authApi.sendOtp(email)
      setDigits(Array(CODE_LENGTH).fill(""))
      setInvalid(Array(CODE_LENGTH).fill(false))
      setSecondsLeft(OTP_EXPIRY_SECONDS)
      showMessage("Se envió un nuevo código de verificación.", "success")
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      showMessage(err.message || "No se pudo reenviar el código", "error")
    } finally {
      setIsLoading(false)
    }
  }

  /* ----- Clases compartidas ----- */
  const btnPrimaryClass =
    "inline-flex min-h-11 w-full items-center justify-center rounded-[10px] border-0 bg-[#ea580c] px-4 text-[14px] font-extrabold text-white transition-[background-color,transform,opacity] duration-200 hover:-translate-y-px hover:bg-[#c2410c] disabled:translate-y-0 disabled:opacity-70"
  const btnResendClass =
    "mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[10px] border-2 border-[#ea580c] bg-white px-4 text-[14px] font-extrabold text-[#ea580c] transition-[background-color,border-color,opacity] duration-200 hover:bg-[#fff7ed] disabled:cursor-not-allowed disabled:border-[#eadfd6] disabled:text-[#aa9d94] disabled:opacity-80"
  const btnBackClass =
    "mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-transparent px-4 text-[14px] font-extrabold text-[#62564f] no-underline transition-colors duration-200 hover:text-[#ea580c]"
  const otpInputClass =
    "h-[54px] w-[45px] rounded-[10px] border bg-white p-0 text-center text-[22px] font-extrabold text-[#24130b] outline-none transition-[border-color,box-shadow,transform] duration-200 focus:-translate-y-px focus:border-[#ea580c] focus:shadow-[0_0_0_3px_rgba(234,88,12,0.13)] disabled:opacity-60 max-[600px]:h-[50px] max-[600px]:w-10"

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-[#fff7ed] text-[#24130b]">
      <main className="relative grid min-h-0 flex-1 place-items-center overflow-hidden px-14 pb-[34px] pt-[76px] max-[1000px]:overflow-visible max-[1000px]:px-6 max-[1000px]:pb-[35px] max-[1000px]:pt-[82px] max-[600px]:px-[15px] max-[600px]:pb-6 max-[600px]:pt-[64px]">
        {/* Zona naranja diagonal */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(225deg,transparent_0_54%,#ea580c_54%_100%)]"
        />
        {/* Acento diagonal más oscuro sobre la zona naranja */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-[linear-gradient(225deg,transparent_30%,#c2410c_30%_46%,transparent_46%)] opacity-[0.42]"
        />

        {/* Marca */}
        <Link
          to="/project-management/login"
          aria-label="Business & Development — Venezuela"
          className="absolute right-14 top-6 z-10 max-[1000px]:right-6 max-[600px]:left-[18px] max-[600px]:right-auto max-[600px]:top-5"
        >
          <BrandLogo />
        </Link>

        <div className="relative z-[2] grid w-[min(1180px,100%)] grid-cols-[420px_minmax(0,1fr)] items-center gap-[clamp(32px,5vw,64px)] max-[1000px]:grid-cols-1 max-[1000px]:gap-[38px]">
          {/* Tarjeta OTP */}
          <section
            aria-labelledby="otp-title"
            className="order-1 w-[420px] max-w-full rounded-[20px] bg-white p-[30px_34px_26px] text-center shadow-[0_24px_55px_rgba(36,19,11,0.27)] max-[1000px]:mx-auto max-[600px]:w-full max-[600px]:p-[26px_20px_22px]"
          >
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-1 text-center"
              >
                <div className="mx-auto mb-4 mt-1 grid size-[68px] place-items-center rounded-full bg-[#159447]">
                  <CheckIcon className="size-9 text-white" />
                </div>
                <h2 className="mb-2 text-[23px] font-extrabold">¡Código verificado!</h2>
                <p className="mb-[22px] text-[14px] text-[#62564f]">
                  Tu cuenta ha sido confirmada correctamente.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/project-management/login")}
                  className="block w-full rounded-[10px] bg-[#ea580c] px-4 py-3 text-[14px] font-extrabold text-white transition hover:-translate-y-px hover:bg-[#c2410c]"
                >
                  Ir a iniciar sesión
                </button>
              </motion.div>
            ) : (
              <>
                <BrandLogo compact size={46} className="mx-auto mb-4" />

                <h1 id="otp-title" className="mb-2.5 text-[28px] font-extrabold leading-[1.2] tracking-[-0.035em]">
                  Verificar código
                </h1>

                <p className="mx-auto mb-6 max-w-[315px] text-[14px] leading-[1.55] text-[#62564f]">
                  Hemos enviado un código de verificación a{" "}
                  <span className="font-extrabold text-[#24130b]">
                    {email || "tu correo electrónico"}
                  </span>
                  . Escríbelo para continuar.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                  {/* 6 inputs OTP */}
                  <div className="mb-[12px] flex justify-center gap-[9px] max-[600px]:gap-1.5">
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        name={`otp-${index + 1}`}
                        id={`otp-${index + 1}`}
                        aria-label={`Dígito ${index + 1}`}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        onAnimationEnd={() => setShaking(false)}
                        disabled={isLoading}
                        className={`${otpInputClass} ${
                          invalid[index] ? "border-[#d92d20]" : "border-[#eadfd6]"
                        } ${shaking ? "otp-shake" : ""}`}
                      />
                    ))}
                  </div>

                  <p className="mb-[7px] text-[13px] text-[#62564f]">El código expira en:</p>
                  <div
                    className={`mb-5 text-[19px] font-extrabold transition-colors duration-300 ${
                      expired ? "text-[#d92d20]" : "text-[#ea580c]"
                    }`}
                  >
                    {expired ? "Código expirado" : formatTime(secondsLeft)}
                  </div>

                  <button type="submit" disabled={isLoading} className={btnPrimaryClass}>
                    {isLoading ? "Verificando..." : "Verificar código"}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!expired || isLoading}
                    className={btnResendClass}
                  >
                    Volver a enviar
                  </button>

                  <div
                    aria-live="polite"
                    className={`mt-2.5 min-h-[18px] text-[12px] font-bold ${
                      message?.type === "error"
                        ? "text-[#d92d20]"
                        : message?.type === "success"
                          ? "text-[#159447]"
                          : ""
                    }`}
                  >
                    {message?.text ?? ""}
                  </div>

                  <Link to="/project-management/register" className={btnBackClass}>
                    Volver al registro
                  </Link>
                </form>
              </>
            )}
          </section>

          {/* Promoción derecha */}
          <section
            aria-label="Verificación segura"
            className="order-2 relative left-[70px] w-[610px] max-w-full min-w-0 justify-self-end pt-2.5 text-center max-[1000px]:left-0 max-[1000px]:mx-auto max-[1000px]:w-[min(610px,100%)] max-[1000px]:justify-self-center"
          >
            <div className="relative mx-auto mb-[12px] w-[260px] max-w-full">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[125px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_55%_45%/55%_45%_55%_45%] bg-[#ea580c] opacity-[0.18] max-[600px]:h-[105px] max-[600px]:w-[165px]"
              />
              <div className="relative mx-auto w-[240px] max-w-full">
                <OtpEnvelopeIllustration />
              </div>
            </div>

            <h2 className="mx-auto mb-2 w-[400px] max-w-full text-center text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.03] tracking-[-0.045em] text-[#24130b] max-[600px]:text-[28px]">
              Protege tu cuenta y
              <br />
              <mark className="inline-block rounded-md bg-[#fb923c] px-2 pb-[1px] font-serif font-bold italic leading-[0.93] text-white">
                verifica tu identidad
              </mark>
            </h2>

            <p className="mx-auto w-[400px] max-w-full text-center text-[15px] leading-[1.5] text-[#62564f] max-[600px]:text-[15px]">
              Introduce el código que enviamos a tu correo electrónico para completar el registro
              de forma segura.
            </p>
          </section>
        </div>
      </main>

      <footer className="flex items-center justify-between gap-4 bg-[#24130b] px-10 py-3 text-[13px] font-bold text-white max-[600px]:flex-wrap max-[600px]:px-[18px]">
        <span>Business &amp; development — Venezuela</span>
        <span className="text-[11px] font-medium text-white/60">© 2026 Todos los derechos reservados</span>
      </footer>
    </div>
  )
}
