import { Link } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { BrandLogo } from "./BrandLogo";

/** Ilustración del diseño: escena de escritorio con indicadores (SVG inline). */
function DeskSceneIllustration() {
  return (
    <svg viewBox="0 0 420 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Grúa/lámpara */}
      <rect x="298" y="70" width="10" height="80" rx="3" fill="#ea580c" />
      <rect x="285" y="146" width="36" height="14" rx="4" fill="#ea580c" />
      <path d="M270 40h66l14 40h-94l14-40Z" fill="#fb923c" />

      {/* Barras del gráfico */}
      <rect x="90" y="190" width="10" height="90" rx="3" fill="#ffe8d3" stroke="#ea580c" strokeWidth="2" />
      <rect x="330" y="190" width="10" height="90" rx="3" fill="#ffe8d3" stroke="#ea580c" strokeWidth="2" />
      <rect x="150" y="190" width="10" height="70" rx="3" fill="#ffe8d3" stroke="#ea580c" strokeWidth="2" />
      <rect x="270" y="190" width="10" height="70" rx="3" fill="#ffe8d3" stroke="#ea580c" strokeWidth="2" />

      {/* Base del gráfico */}
      <rect x="60" y="160" width="300" height="32" rx="6" fill="#ffe8d3" stroke="#ea580c" strokeWidth="2" />
      <rect x="80" y="170" width="60" height="10" rx="3" fill="none" stroke="#ea580c" strokeWidth="2" />
      <rect x="150" y="170" width="120" height="10" rx="3" fill="none" stroke="#ea580c" strokeWidth="2" />
      <rect x="280" y="170" width="60" height="10" rx="3" fill="none" stroke="#ea580c" strokeWidth="2" />

      {/* Persona trabajando */}
      <path d="M195 90q40-10 55 40 10 40-15 70h-45q-25-20-20-60 5-35 25-50Z" fill="#fb923c" />
      <rect x="175" y="195" width="90" height="18" rx="9" fill="#fb923c" />
      <rect x="215" y="213" width="10" height="35" fill="#ea580c" />
      <circle cx="220" cy="255" r="10" fill="#ea580c" />
      <line x1="220" y1="255" x2="185" y2="278" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
      <line x1="220" y1="255" x2="255" y2="278" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
      <line x1="220" y1="255" x2="220" y2="285" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
      <circle cx="185" cy="278" r="6" fill="#ea580c" />
      <circle cx="255" cy="278" r="6" fill="#ea580c" />
      <circle cx="220" cy="285" r="6" fill="#ea580c" />
    </svg>
  );
}

export const LoginPage = () => {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-white text-[#1c0f08]">
      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible px-5 pb-6 pt-[56px] sm:px-10 sm:pb-7 sm:pt-[76px] lg:px-14 lg:pb-6">
        {/* Zona naranja diagonal */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_54%,#ea580c_54%,#ea580c_100%)]"
        />
        {/* Acento diagonal más oscuro */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[linear-gradient(135deg,transparent_30%,#c2410c_30%,#c2410c_46%,transparent_46%)] opacity-55"
        />

        {/* Marca */}
        <Link
          to="/"
          aria-label="Business & Development — Venezuela"
          className="absolute left-5 top-5 z-10 sm:left-10 lg:left-14 lg:top-[25px]"
        >
          <BrandLogo />
        </Link>

        <div className="relative z-[2] grid w-[min(1180px,100%)] grid-cols-1 items-center gap-8 px-4 sm:px-0 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          {/* Promoción izquierda */}
          <section
            aria-label="Información del sistema"
            className="order-1 mx-auto w-full max-w-[480px] text-center"
          >
            <div className="relative mx-auto mb-3 w-[200px] sm:w-[230px] lg:w-[250px] max-w-full">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-[76px] w-[135px] -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_55%_45%/55%_45%_55%_45%] bg-[#ea580c] opacity-20 sm:h-[84px] sm:w-[150px]"
              />
              <div className="relative mx-auto w-[170px] sm:w-[190px] lg:w-[190px] max-w-full">
                <DeskSceneIllustration />
              </div>
            </div>

            <h2 className="mx-auto mb-2 w-full max-w-[400px] text-center text-[clamp(27px,3.4vw,38px)] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#1c0f08] sm:text-[28px]">
              Gestión de proyectos,
              <br />
              <mark className="inline-block rounded-[5px] bg-white px-[7px] pb-[2px] pt-[1px] leading-[0.95] text-[#1c0f08]">
                de principio a fin
              </mark>
            </h2>

            <p className="mx-auto w-full max-w-[400px] text-center text-[15px] leading-[1.45] text-[#57534e]">
              Planifica, ejecuta y da seguimiento a cada proyecto: presupuesto, avance físico,
              finanzas y entregables en un solo lugar.
            </p>
          </section>

          {/* Tarjeta de login */}
          <div className="order-2 mx-auto w-full max-w-[380px]">
            <LoginForm />
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between gap-4 bg-[#1c0f08] px-5 py-3 text-[13px] font-semibold text-white sm:px-10 lg:px-14 sm:flex-wrap">
        <span>Business &amp; Development — Venezuela</span>
        <span className="text-[11px] font-normal text-white/60">© 2026 Todos los derechos reservados</span>
      </footer>
    </div>
  );
};
