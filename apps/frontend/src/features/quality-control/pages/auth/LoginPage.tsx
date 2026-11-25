import { Link } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { QcAuthLogo } from "./QcAuthLogo";

/** Ilustración del diseño: panel de calidad con medidor y check de conformidad. */
function QualitySceneIllustration() {
  return (
    <svg viewBox="0 0 420 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Medidor semicircular */}
      <path d="M70 220a140 140 0 0 1 280 0" stroke="#a7f3d0" strokeWidth="18" strokeLinecap="round" />
      <path
        d="M118 220a92 92 0 0 1 184 0"
        stroke="#059669"
        strokeWidth="18"
        strokeLinecap="round"
      />
      {/* Aguja */}
      <line x1="210" y1="220" x2="258" y2="152" stroke="#064e3b" strokeWidth="6" strokeLinecap="round" />
      <circle cx="210" cy="220" r="11" fill="#064e3b" />
      <circle cx="210" cy="220" r="4.5" fill="#34d399" />

      {/* Tarjetas flotantes */}
      <rect x="52" y="96" width="118" height="52" rx="12" fill="white" stroke="#dce8e0" strokeWidth="2" />
      <rect x="68" y="110" width="24" height="24" rx="7" fill="#ecfdf5" />
      <path d="m76 122 3.4 3.4 6.2-6.6" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="100" y="112" width="56" height="6" rx="3" fill="#c7dbd0" />
      <rect x="100" y="124" width="38" height="6" rx="3" fill="#e2ece6" />

      <rect x="252" y="92" width="118" height="52" rx="12" fill="white" stroke="#dce8e0" strokeWidth="2" />
      <rect x="268" y="106" width="24" height="24" rx="7" fill="#fef2f2" />
      <path d="m274 118 3.4 3.4 6.2-6.6" stroke="#dc2626" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 277.6 121.4)" />
      <rect x="300" y="108" width="56" height="6" rx="3" fill="#c7dbd0" />
      <rect x="300" y="120" width="38" height="6" rx="3" fill="#e2ece6" />

      {/* Barras */}
      <rect x="120" y="258" width="12" height="26" rx="3" fill="#059669" />
      <rect x="150" y="248" width="12" height="36" rx="3" fill="#34d399" />
      <rect x="180" y="262" width="12" height="22" rx="3" fill="#a7f3d0" />
      <rect x="210" y="252" width="12" height="32" rx="3" fill="#34d399" />
      <rect x="240" y="240" width="12" height="44" rx="3" fill="#047857" />
      <rect x="270" y="256" width="12" height="28" rx="3" fill="#a7f3d0" />
      <rect x="300" y="246" width="12" height="38" rx="3" fill="#34d399" />

      {/* Escudo check */}
      <g transform="translate(336 30)">
        <path d="M14 2.5 24 6v7c0 5.3-3.4 9.7-10 12C7.4 22.7 4 18.3 4 13V6l10-3.5Z" fill="#059669" />
        <path d="m10.2 13.1 2.5 2.5 4.8-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

export const LoginPage = () => {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-white text-[#101f19]">
      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible px-5 pb-6 pt-[56px] sm:px-10 sm:pb-7 sm:pt-[76px] lg:px-14 lg:pb-6">
        {/* Zona verde diagonal */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,transparent_54%,#059669_54%,#059669_100%)]"
        />
        {/* Acento diagonal más oscuro */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[linear-gradient(135deg,transparent_30%,#047857_30%,#047857_46%,transparent_46%)] opacity-50"
        />

        {/* Marca */}
        <Link
          to="/"
          aria-label="Business & Development — Venezuela"
          className="absolute left-5 top-5 z-10 sm:left-10 lg:left-14 lg:top-[25px]"
        >
          <QcAuthLogo />
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
                className="absolute left-1/2 top-1/2 h-[76px] w-[135px] -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_55%_45%/55%_45%_55%_45%] bg-[#059669] opacity-15 sm:h-[84px] sm:w-[150px]"
              />
              <div className="relative mx-auto w-[170px] sm:w-[190px] lg:w-[190px] max-w-full">
                <QualitySceneIllustration />
              </div>
            </div>

            <h2 className="mx-auto mb-2 w-full max-w-[400px] text-center text-[clamp(27px,3.4vw,38px)] font-extrabold leading-[1.06] tracking-[-0.035em] text-[#101f19] sm:text-[28px]">
              Calidad que se
              <br />
              <mark className="inline-block rounded-[5px] bg-white px-[7px] pb-[2px] pt-[1px] leading-[0.95] text-[#101f19]">
                mide y se cumple
              </mark>
            </h2>

            <p className="mx-auto w-full max-w-[400px] text-center text-[15px] leading-[1.45] text-[#5b7267]">
              Indicadores, mediciones y reportes de gestión en un solo lugar.
            </p>
          </section>

          {/* Tarjeta de login */}
          <div className="order-2 mx-auto w-full max-w-[380px]">
            <LoginForm />
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between gap-4 bg-[#064e3b] px-5 py-3 text-[13px] font-semibold text-white sm:px-10 lg:px-14 sm:flex-wrap">
        <span>Business &amp; Development — Venezuela</span>
        <span className="text-[11px] font-normal text-white/60">© 2026 Todos los derechos reservados</span>
      </footer>
    </div>
  );
};
