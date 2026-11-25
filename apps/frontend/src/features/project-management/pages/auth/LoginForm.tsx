import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginSkeleton } from "@/features/auth/components/login-skeleton"
import { usePmAuth } from "../../hooks/usePmAuth"
import { BrandLogo } from "./BrandLogo"

/** Ícono de Google del diseño. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.4-4.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.6 0-14.1 4.3-17.4 10.6z"
      />
      <path
        fill="#4CAF50"
        d="M24 45.5c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4c-2 1.5-4.6 2.5-7.7 2.5-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.8 41.1 16.3 45.5 24 45.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.4C41.4 36.3 44.5 31.1 44.5 25c0-1.5-.2-3-.4-4.5z"
      />
    </svg>
  )
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = useState(false)
  const [loginIdentifier, setLoginIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const { login, isLoggingIn } = usePmAuth()
  const isLoading = isLoggingIn

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login({ login: loginIdentifier.trim(), password })
  }

  const handleGoogleLogin = () => {
    toast.info("Iniciar sesión con Google estará disponible próximamente")
  }

  return (
    <section
      aria-labelledby="login-title"
      className={cn(
        "w-full rounded-[18px] bg-white p-5 shadow-[0_24px_50px_rgba(28,15,8,0.25)] sm:p-[26px_28px_22px]",
        className
      )}
      {...props}
    >
      <BrandLogo compact size={46} className="mx-auto mb-2" />
      <h1
        id="login-title"
        className="mb-4 text-center text-[26px] font-extrabold leading-[1.2] tracking-[-0.02em]"
      >
        Iniciar sesión
      </h1>

      {isLoading ? (
        <LoginSkeleton />
      ) : (
        <>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex min-h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-[#e5ddd5] bg-white px-3.5 py-[9px] text-[14px] font-semibold text-[#1c0f08] transition-[border-color,box-shadow] duration-200 hover:border-[#fb923c] hover:shadow-[0_4px_12px_rgba(234,88,12,0.12)]"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <div className="my-3 flex items-center gap-3 text-[13px] text-[#57534e]">
            <span aria-hidden="true" className="h-px flex-1 bg-[#eadfd6]" />
            o
            <span aria-hidden="true" className="h-px flex-1 bg-[#eadfd6]" />
          </div>

          <span className="mb-3 block text-center text-[13px] text-[#57534e]">
            Continuar con tu correo electrónico
          </span>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label
                htmlFor="login"
                className="mb-1.5 block text-[13px] font-semibold text-[#1c0f08]"
              >
                Correo o usuario
              </label>
              <input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                placeholder="nombre@ejemplo.com o tu usuario"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                disabled={isLoading}
                className="h-11 w-full rounded-lg border border-[#e5ddd5] bg-white px-3.5 text-[15px] font-medium text-[#1c0f08] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#a8a29e] focus:border-[#ea580c] focus:shadow-[0_0_0_3px_rgba(234,88,12,0.12)] disabled:opacity-60"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-semibold text-[#1c0f08]"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11 w-full rounded-lg border border-[#e5ddd5] bg-white py-3 pl-3.5 pr-11 text-[15px] font-medium text-[#1c0f08] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#a8a29e] focus:border-[#ea580c] focus:shadow-[0_0_0_3px_rgba(234,88,12,0.12)] disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  disabled={isLoading}
                  className="absolute bottom-[11px] right-[13px] grid size-[25px] place-items-center border-0 bg-transparent p-0 text-[#57534e] transition-colors duration-200 hover:text-[#ea580c] disabled:opacity-60"
                >
                  {showPassword ? (
                    <EyeOff className="size-[19px]" />
                  ) : (
                    <Eye className="size-[19px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-[15px] mt-px text-right">
              <Link
                to="/project-management/forgot-password"
                className="text-[13px] text-[#ea580c] no-underline hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mb-3.5 min-h-[44px] w-full rounded-lg bg-[#ea580c] px-3.5 py-[11px] text-[15px] font-bold text-white transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#c2410c] disabled:translate-y-0 disabled:opacity-70"
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-[13px] text-[#57534e]">
            ¿Eres nuevo aquí?{" "}
            <Link
              to="/project-management/register"
              className="font-bold text-[#ea580c] no-underline hover:underline"
            >
              Crea una cuenta
            </Link>
          </p>
        </>
      )}
    </section>
  )
}
