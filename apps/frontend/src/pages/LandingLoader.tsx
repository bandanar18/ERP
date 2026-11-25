import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import businessLogo from "@/assets/business.webp";

/** Alturas relativas de las 9 barras del logo corporativo. */
const BAR_HEIGHTS = [34, 58, 42, 78, 94, 68, 84, 52, 66];

type LandingLoaderProps = {
  /** Se invoca cuando la cortina termina de abrirse. */
  onComplete: () => void;
};

/* ============================================================================
   Pantalla de carga premium de la landing (Business ERP)
   - Logo corporativo con glow + entrada elástica
   - Equalizer de 9 barras (motivo del logo)
   - Contador 00 → 100 + línea de progreso
   - Salida de cortina (dos paneles se abren) que revela la landing
============================================================================ */
export const LandingLoader = ({ onComplete }: LandingLoaderProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap
          .timeline()
          .to(".erp-loader__content", { autoAlpha: 1, duration: 0.25 })
          .to(root, { autoAlpha: 0, duration: 0.4, delay: 0.7, onComplete });
        return;
      }

      const counter = root.querySelector<HTMLElement>(".erp-loader__count");
      const bars = gsap.utils.toArray<HTMLElement>(".erp-loader__bar");
      const fill = root.querySelector<HTMLElement>(".erp-loader__fill");
      const tip = root.querySelector<HTMLElement>(".erp-loader__tip");

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // ── Estado inicial ──────────────────────────────────────────────
      gsap.set([".erp-loader__glow", ".erp-loader__logo", ".erp-loader__word", ".erp-loader__meta", ".erp-loader__version"], {
        autoAlpha: 0,
      });
      gsap.set(".erp-loader__bar", { scaleY: 0, transformOrigin: "bottom" });
      gsap.set(".erp-loader__status", { autoAlpha: 0, y: 8 });
      gsap.set(".erp-loader__fill", { scaleX: 0, transformOrigin: "left" });
      gsap.set(".erp-loader__tip", { scale: 0, autoAlpha: 0 });

      // ── 1 · Glow + logo (entrada elástica) ──────────────────────────
      tl.fromTo(
        ".erp-loader__glow",
        { scale: 0.4, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1.1, ease: "power2.out" },
        0.1
      )
        .fromTo(
          ".erp-loader__logo",
          { scale: 0.55, rotation: -8, autoAlpha: 0 },
          { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.05, ease: "back.out(1.7)" },
          0.18
        )
        .fromTo(
          ".erp-loader__word",
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, letterSpacing: "0.36em" },
          0.78
        )
        .fromTo(
          ".erp-loader__meta",
          { y: 8, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5 },
          0.85
        )
        .fromTo(".erp-loader__version", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.95);

      // ── 2 · Equalizer (las 9 barras del logo) ───────────────────────
      tl.fromTo(
        ".erp-loader__bar",
        { scaleY: 0 },
        { scaleY: 1, duration: 0.55, stagger: 0.055, ease: "back.out(2)" },
        0.52
      ).add(() => {
        bars.forEach((bar) => bar.classList.add("erp-loader__bar--live"));
      }, ">-0.05");

      // ── 3 · Progreso premium: contador + barra con cometa y brillo ──
      // Curva orgánica de "carga": arranque rápido → meseta → aceleración final.
      const loaderEase = (p: number) => {
        if (p < 0.25) return (p / 0.25) * 0.34; // arranque rápido hasta 34%
        if (p < 0.62) return 0.34 + Math.pow((p - 0.25) / 0.37, 0.55) * 0.4; // meseta lenta → 74%
        return 0.74 + Math.pow((p - 0.62) / 0.38, 1.35) * 0.26; // aceleración final → 100%
      };

      const proxy = { p: 0 };
      tl.to(proxy, {
        p: 1,
        duration: 1.7,
        ease: loaderEase,
        onUpdate: () => {
          const v = proxy.p;
          if (counter) counter.textContent = String(Math.round(v * 100)).padStart(2, "0");
          if (fill) fill.style.transform = `scaleX(${v})`;
          if (tip) tip.style.left = `${v * 100}%`;
        },
        onComplete: () => {
          // Destello de la cometa al llegar a 100%
          tl.to(".erp-loader__tip", { scale: 1.9, autoAlpha: 1, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, 0.06);
          tl.to(".erp-loader__fill", { boxShadow: "0 0 26px rgba(255,85,0,1)", duration: 0.25 }, 0.02);
        },
      }, 0.92);

      // Aparición suave del bloque de progreso
      tl.fromTo(".erp-loader__status", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.78);
      // La cometa aparece cuando la barra empieza a llenarse
      tl.fromTo(".erp-loader__tip", { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(2)" }, 1.0);

      // ── 4 · Salida: el contenido se eleva y la cortina se abre ──────
      tl.to(".erp-loader__content", { y: -30, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, 2.5);
      tl.to(
        ".erp-loader__panel--top",
        { yPercent: -101, duration: 0.95, ease: "power4.inOut" },
        2.45
      );
      tl.to(
        ".erp-loader__panel--bottom",
        { yPercent: 101, duration: 0.95, ease: "power4.inOut", onComplete },
        2.45
      );
    }, root);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div ref={rootRef} className="erp-loader" role="status" aria-label="Cargando Business ERP">
      {/* Cortina (dos paneles que se abren al final) */}
      <div className="erp-loader__panel erp-loader__panel--top" aria-hidden="true" />
      <div className="erp-loader__panel erp-loader__panel--bottom" aria-hidden="true" />

      {/* Glow naranja detrás del logo */}
      <div className="erp-loader__glow" aria-hidden="true" />

      {/* Contenido central */}
      <div className="erp-loader__content" aria-hidden="true">
        <div className="erp-loader__logo">
          <img src={businessLogo} alt="Business & Development Venezuela" />
        </div>
        <div className="erp-loader__bars">
          {BAR_HEIGHTS.map((height, i) => (
            <span
              key={i}
              className="erp-loader__bar"
              style={
                {
                  height: `${height}%`,
                  "--wave-dur": `${1.1 + (i % 4) * 0.16}s`,
                  "--wave-delay": `${-i * 0.17}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="erp-loader__word">Plataforma operativa</div>
      </div>

      {/* Progreso inferior: riel + relleno + cometa + contador */}
      <div className="erp-loader__status" aria-hidden="true">
        <div className="erp-loader__line">
          <span className="erp-loader__fill">
            <span className="erp-loader__shimmer" />
          </span>
          <span className="erp-loader__tip" />
        </div>
        <strong className="erp-loader__count">00</strong>
      </div>

      {/* Esquinas */}
      <div className="erp-loader__meta" aria-hidden="true">
        Cargando sistema
      </div>
      <div className="erp-loader__version" aria-hidden="true">
        Business ERP · v2.4
      </div>
    </div>
  );
};
