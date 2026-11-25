import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Menu, Moon, Sun, Sparkles, X } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./landing.css";
import businessLogo from "@/assets/business.webp";
import erpVideo from "@/assets/erp2.mp4";
import { LandingLoader } from "./LandingLoader";
import { isLocalHost, moduleLink, moduleLoginLink, type ModuleKey } from "@/config/domains";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================================
   Módulos reales del ERP (los que existen hoy, con su link y resumen)
============================================================================ */
const REAL_MODULES: Array<{
  number: string;
  rail: string;
  accent: string;
  title: string;
  kicker: string;
  bold: string;
  copy: string;
  module: ModuleKey;
}> = [
  {
    number: "01",
    rail: "01 · Operación · Business ERP",
    accent: "var(--primary)",
    title: "Proyectos",
    kicker: "Ver el pulso",
    bold: "Del plan a la entrega.",
    copy: "Tareas, responsables y fechas visibles para que cada proyecto avance sin zonas grises.",
    module: "project-management",
  },
  {
    number: "02",
    rail: "02 · Operación · Business ERP",
    accent: "var(--pink)",
    title: "Calidad",
    kicker: "Indicadores vivos",
    bold: "Sistema de Gestión de Calidad.",
    copy: "Indicadores, mediciones y reportes en un solo lugar para controlar tus procesos.",
    module: "quality-control",
  },
];

/** Módulos del diseño que aún no están implementados (próximamente). */
const SOON_MODULES = [
  { number: "03", title: "Inventario", kicker: "Siempre a la vista", bold: "Stock que responde.", copy: "Existencias, movimientos y alertas para comprar con precisión y servir mejor.", accent: "var(--lime)" },
  { number: "04", title: "Finanzas", kicker: "Decidir mejor", bold: "La caja, sin sorpresas.", copy: "Flujo de caja y rentabilidad en una lectura clara para tomar decisiones a tiempo.", accent: "var(--blue)" },
  { number: "05", title: "CRM", kicker: "Relaciones activas", bold: "Más cerca del cliente.", copy: "Cada conversación, oportunidad y siguiente paso en un solo recorrido comercial.", accent: "var(--yellow)" },
  { number: "06", title: "Compras", kicker: "Negociar con contexto", bold: "Costes bajo control.", copy: "Proveedores, órdenes y aprobaciones sincronizados con lo que realmente necesita tu operación.", accent: "var(--teal)" },
];

/* ============================================================================
   Landing principal — página de inicio del ERP
============================================================================ */
const ModuleAccessLink = ({ module, label }: { module: ModuleKey; label: string }) => {
  const to = moduleLoginLink(module);
  return isLocalHost() ? <Link to={to}>{label}</Link> : <a href={to}>{label}</a>;
};

export const LandingPage = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Al recargar, la landing siempre abre arriba (sin restaurar scroll) ──
  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.documentElement.classList.add("landing-page");
    return () => {
      document.documentElement.classList.remove("landing-page");
      delete document.documentElement.dataset.theme;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const root = rootRef.current;
    const nav = navRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll suave (Lenis) + sync con ScrollTrigger
    const lenis = new Lenis({ autoRaf: true, anchors: true, allowNestedScroll: true });
    lenisRef.current = lenis;
    // Garantiza que Lenis parta desde arriba aunque el navegador restaurase scroll
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.on("scroll", () => ScrollTrigger.update());

    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 45);
    window.addEventListener("scroll", onScroll, { passive: true });

    let ctx: gsap.Context | null = null;
    if (!reduceMotion) {
      ctx = gsap.context(() => {
        // NOTA: las animaciones de entrada del hero (hero-reveal, video,
        // hero-panel) corren tras el loader — ver efecto `loading`.
        gsap.to(".hero-media video", {
          yPercent: -7,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 },
        });
        gsap.to(".hero-panel", {
          y: -50,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 },
        });
        gsap.from(".section-title", {
          yPercent: 90,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ".section-head", start: "top 82%" },
        });
        gsap.from(".section-stat", {
          y: 24,
          autoAlpha: 0,
          duration: 0.55,
          ease: "power2.out",
          scrollTrigger: { trigger: ".section-head", start: "top 82%" },
        });
        gsap.utils.toArray<HTMLElement>(".module-reveal").forEach((row, index) => {
          gsap.from(row, {
            x: index % 2 ? 90 : -90,
            autoAlpha: 0,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 88%" },
          });
          gsap.from(row.querySelector(".module-number"), {
            y: 30,
            autoAlpha: 0,
            duration: 0.65,
            delay: 0.12,
            ease: "power2.out",
            scrollTrigger: { trigger: row, start: "top 88%" },
          });
        });

        const mm = gsap.matchMedia();
        mm.add("(min-width: 701px)", () => {
          const stages = gsap.utils.toArray<HTMLElement>(".story-stage");
          const dots = gsap.utils.toArray<HTMLElement>(".story-progress span");
          gsap.set(stages.slice(1), { xPercent: 100 });
          const sequence = gsap.timeline({ defaults: { ease: "power2.inOut", duration: 1 } });
          sequence
            .to(stages[0], { xPercent: -100 }, "+=.2")
            .to(stages[1], { xPercent: 0 }, "<")
            .to(stages[1], { xPercent: -100 }, "+=.2")
            .to(stages[2], { xPercent: 0 }, "<");
          ScrollTrigger.create({
            animation: sequence,
            trigger: "#story",
            start: "top top",
            end: "+=2200",
            pin: ".story-frame",
            scrub: 0.75,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const active = Math.min(Math.floor(self.progress * stages.length), stages.length - 1);
              dots.forEach((dot, i) => dot.classList.toggle("active", i === active));
              stages.forEach((stage, i) => stage.classList.toggle("stage-active", i === active));
            },
          });
        });
        mm.add("(max-width: 700px)", () => {
          gsap.utils.toArray<HTMLElement>(".story-stage").forEach((stage) =>
            ScrollTrigger.create({
              trigger: stage,
              start: "top 72%",
              onEnter: () => stage.classList.add("stage-active"),
              onEnterBack: () => stage.classList.add("stage-active"),
            })
          );
        });
        gsap.from(".cta-line", {
          y: 55,
          rotation: (i: number) => (i % 2 ? 4 : -4),
          autoAlpha: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".cta", start: "top 76%" },
        });
        gsap.from(".demo-banner", {
          y: 36,
          autoAlpha: 0,
          rotation: 1,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: { trigger: ".demo-banner", start: "top 88%" },
        });
        gsap.from(".footer-column", {
          y: 25,
          autoAlpha: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: ".footer-nav", start: "top 88%" },
        });
      }, root);
    }

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", onLoad);
      ctx?.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      lenis.destroy();
    };
  }, []);

  // ── Mientras el loader está activo: bloquear scroll y pausar Lenis ──
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (loading) {
      document.body.style.overflow = "hidden";
      lenisRef.current?.stop();
    } else {
      // Al destapar la cortina, asegurar que la landing parte desde arriba
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      lenisRef.current?.scrollTo(0, { immediate: true, force: true });
      lenisRef.current?.start();
      document.body.style.overflow = prev;
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [loading]);

  // ── Intro del hero: corre cuando la cortina del loader se abre ──────
  useEffect(() => {
    if (loading) return;
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-reveal", { y: 38, autoAlpha: 0, duration: 0.72, stagger: 0.1, ease: "power3.out", delay: 0.15 });
      gsap.from(".hero-media video", { scale: 1.12, xPercent: 7, duration: 1.4, ease: "power3.out", delay: 0.05 });
      gsap.from(".hero-panel", { y: 28, autoAlpha: 0, rotation: -3, duration: 0.8, ease: "back.out(1.4)", delay: 0.65 });
    }, root);
    return () => ctx.revert();
  }, [loading]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      return next;
    });
  };

  const scrollToModules = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector("#modules")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {loading && <LandingLoader onComplete={() => setLoading(false)} />}
      <div ref={rootRef} className="erp-landing" data-theme={theme}>
      {/* ============ NAV ============ */}
      <header ref={navRef} className="hero-nav" id="hero-nav">
        <a aria-label="Business ERP inicio" className="wordmark" href="#top">
          <img src={businessLogo} alt="Business ERP logo" style={{ height: 36, width: "auto", display: "block" }} />
        </a>
        <nav aria-label="Navegación principal" className="nav-links">
          <a className="nav-link" href="#modules">
            Módulos
          </a>
          <a className="nav-link" href="#story">
            Cómo funciona
          </a>
          <a className="nav-link" href="#footer">
            Recursos
          </a>
        </nav>
        <div className="nav-actions">
          <button
            aria-label="Cambiar entre tema claro y oscuro"
            className="button theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {theme === "dark" ? "LIGHT" : "DARK"}
          </button>
          <button
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="button menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
          >
            {menuOpen ? <X className="size-3.5" /> : <Menu className="size-3.5" />}
            {menuOpen ? "CERRAR" : "MENÚ"}
          </button>
        </div>
      </header>

      <main id="top">
        {/* ============ HERO ============ */}
        <section aria-labelledby="hero-title" className="hero">
          <div className="hero-media">
            <video autoPlay loop muted playsInline className="hero-video">
              <source src={erpVideo} type="video/mp4" />
            </video>
          </div>
          <div className="hero-copy">
            <span className="eyebrow hero-reveal">Plataforma operativa · Business ERP</span>
            <h1 className="display hero-title hero-reveal" id="hero-title">
              Todo tu negocio.
              <br />
              En un mismo
              <br />
              pulso.
            </h1>
            <p className="hero-support hero-reveal">
              Conecta equipos, finanzas y operación en una sola fuente de verdad. Menos fricción para el día a día. Más
              claridad para crecer.
            </p>
            <div className="hero-actions hero-reveal">
              <a className="button button-primary" href="#modules" onClick={scrollToModules}>
                Explorar módulos <ArrowRight aria-hidden="true" className="size-4" />
              </a>
              <a className="hero-secondary" href="#story">
                Conocer Business ERP
              </a>
            </div>
          </div>
          <div aria-label="Resumen de Business ERP" className="hero-panel">
            <div className="panel-top">
              <strong className="panel-title">
                02
                <br />
                módulos
              </strong>
              <span className="panel-copy">
                01 fuente
                <br />
                de verdad
              </span>
            </div>
            <div className="panel-stat">
              <strong className="panel-number">+32%</strong>
              <span className="panel-label">más visibilidad operativa</span>
            </div>
            <div aria-hidden="true" className="bars">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div aria-hidden="true" className="scroll-hint">
            <span className="scroll-line" />
            <span>Scroll para explorar</span>
          </div>
        </section>

        {/* ============ MARQUEE ============ */}
        <div aria-label="Business ERP mensajes clave" className="marquee">
          <div className="marquee-track">
            <span className="marquee-item">UNA OPERACIÓN. UNA VISIÓN.</span>
            <Sparkles aria-hidden="true" className="marquee-dot orange size-[15px]" />
            <span className="marquee-item">DATOS QUE SE MUEVEN CONTIGO</span>
            <Sparkles aria-hidden="true" className="marquee-dot pink size-[15px]" />
            <span className="marquee-item">TODO BAJO CONTROL</span>
            <Sparkles aria-hidden="true" className="marquee-dot lime size-[15px]" />
            <span className="marquee-item">UNA OPERACIÓN. UNA VISIÓN.</span>
            <Sparkles aria-hidden="true" className="marquee-dot blue size-[15px]" />
            <span className="marquee-item">DATOS QUE SE MUEVEN CONTIGO</span>
            <Sparkles aria-hidden="true" className="marquee-dot orange size-[15px]" />
            <span className="marquee-item">TODO BAJO CONTROL</span>
            <Sparkles aria-hidden="true" className="marquee-dot pink size-[15px]" />
          </div>
        </div>

        {/* ============ MÓDULOS ============ */}
        <section aria-labelledby="modules-title" className="modules" id="modules">
          <div className="section-head">
            <span className="eyebrow">
              <Sparkles aria-hidden="true" className="mr-2 inline size-[13px]" style={{ color: "var(--pink)" }} />
              Mapa operativo
            </span>
            <h2 className="display section-title" id="modules-title">
              El mapa
              <br />
              operativo
            </h2>
            <div className="section-stat">
              <strong>02</strong>
              <span>
                Módulos conectados
                <br />
                para mover el negocio
              </span>
            </div>
          </div>
          <div className="module-list">
            {REAL_MODULES.map((module) => {
              const inner = (
                <>
                  <span className="rail">{module.rail}</span>
                  <span className="module-number">{module.number}</span>
                  <div className="module-main">
                    <h3 className="module-title">{module.title}</h3>
                    <span className="module-kicker">{module.kicker}</span>
                  </div>
                  <div className="module-copy">
                    <strong>{module.bold}</strong>
                    {module.copy}
                  </div>
                  <span className="module-cta">
                    Entrar <ArrowUpRight aria-hidden="true" className="size-[19px]" />
                  </span>
                </>
              );
              return isLocalHost() ? (
                <Link
                  key={module.number}
                  to={moduleLink(module.module)}
                  className="module-row module-reveal"
                  style={{ "--accent": module.accent } as CSSProperties}
                >
                  {inner}
                </Link>
              ) : (
                <a
                  key={module.number}
                  href={moduleLink(module.module)}
                  className="module-row module-reveal"
                  style={{ "--accent": module.accent } as CSSProperties}
                >
                  {inner}
                </a>
              );
            })}
            {SOON_MODULES.map((module) => (
              <div
                key={module.number}
                className="module-row module-reveal"
                style={{ "--accent": module.accent } as CSSProperties}
                aria-disabled="true"
              >
                <span className="rail">{module.number} · Próximamente · Business ERP</span>
                <span className="module-number">{module.number}</span>
                <div className="module-main">
                  <h3 className="module-title">{module.title}</h3>
                  <span className="module-kicker">{module.kicker}</span>
                </div>
                <div className="module-copy">
                  <strong>{module.bold}</strong>
                  {module.copy}
                </div>
                <span className="module-cta" style={{ opacity: 0.45 }}>
                  Próximamente
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ============ STORY / CÓMO FUNCIONA ============ */}
        <section aria-labelledby="story-title" className="story" id="story">
          <div className="story-frame">
            <div className="story-top">
              <span className="eyebrow">
                <Sparkles aria-hidden="true" className="mr-2 inline size-[13px]" style={{ color: "var(--pink)" }} />
                Cómo funciona · La especificación
              </span>
              <span className="display" id="story-title" style={{ fontSize: 24, letterSpacing: "0.12em" }}>
                Hecho para avanzar.
              </span>
            </div>
            <div aria-hidden="true" className="story-progress">
              <span className="active">01</span>
              <span>02</span>
              <span>03</span>
            </div>
            <div className="story-stages">
              <article className="story-stage orange stage-active">
                <span className="stage-number">01</span>
                <div className="stage-body">
                  <h3>
                    Planifica
                    <br />
                    sin fisuras
                  </h3>
                  <p>
                    Convierte la intención en una operación ordenada: prioridades visibles, responsables claros y
                    avance medible.
                  </p>
                  <span className="stage-tag">+32% visibilidad de proyecto</span>
                </div>
                <div aria-hidden="true" className="visual-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </article>
              <article className="story-stage blue">
                <span className="stage-number">02</span>
                <div className="stage-body">
                  <h3>
                    Decide
                    <br />
                    con datos
                  </h3>
                  <p>
                    Una lectura viva de caja, ventas y costes para moverte con velocidad sin perder el contexto.
                  </p>
                  <span className="stage-tag">360° de control financiero</span>
                </div>
                <svg aria-hidden="true" className="visual-gauge" viewBox="0 0 200 200">
                  <circle className="gauge-back" cx="100" cy="100" r="75" />
                  <circle className="gauge-front" cx="100" cy="100" r="75" transform="rotate(-90 100 100)" />
                  <text className="gauge-text" textAnchor="middle" x="100" y="102">
                    86%
                  </text>
                  <text className="gauge-unit" textAnchor="middle" x="100" y="123">
                    CLARIDAD
                  </text>
                </svg>
              </article>
              <article className="story-stage lime">
                <span className="stage-number">03</span>
                <div className="stage-body">
                  <h3>
                    Crece
                    <br />
                    sin fricción
                  </h3>
                  <p>
                    Automatiza lo repetitivo y alinea a las personas para que el siguiente nivel no se sienta más
                    pesado.
                  </p>
                  <span className="stage-tag">1 equipo · una dirección</span>
                </div>
                <ul aria-label="Indicadores de crecimiento" className="indicator-list">
                  <li>
                    Tiempo recuperado <strong>18h</strong>
                  </li>
                  <li>
                    Procesos conectados <strong>24</strong>
                  </li>
                  <li>
                    Señales accionables <strong>09</strong>
                  </li>
                  <li>
                    Rumbo compartido <strong>01</strong>
                  </li>
                </ul>
              </article>
            </div>
            <div aria-hidden="true" className="story-ticker">
              <div className="ticker-track">
                <span>PROYECTOS</span>
                <Sparkles aria-hidden="true" className="dot size-[10px]" />
                <span>CALIDAD</span>
                <Sparkles aria-hidden="true" className="dot size-[10px]" />
                <span>PROYECTOS</span>
                <Sparkles aria-hidden="true" className="dot size-[10px]" />
                <span>CALIDAD</span>
                <Sparkles aria-hidden="true" className="dot size-[10px]" />
                <span>PROYECTOS</span>
                <Sparkles aria-hidden="true" className="dot size-[10px]" />
                <span>CALIDAD</span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section aria-labelledby="cta-title" className="cta" id="demo">
          <span className="eyebrow cta-eyebrow">Solución integral · Proyectos y calidad</span>
          <h2 className="display" id="cta-title">
            <span className="cta-line one">Gestión</span>
            <span className="cta-line two">total.</span>
            <span className="cta-line three">Proyectos</span>
            <span className="cta-line four">conectados.</span>
          </h2>
          <div className="cta-foot">
            <span>02 / 02 · Tu operación no tiene techo</span>
            <span>El motor para equipos que no se detienen</span>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer" id="footer">
        <div className="demo-banner">
          <div>
            <h2>Toma el control absoluto.</h2>
            <p>Elimina el caos. Unifica proyectos y calidad en una sola fuente de verdad.</p>
          </div>
        </div>
        <div className="footer-nav">
          <div className="footer-column">
            <span className="footer-heading">Producto</span>
            <ul>
              <li>
                <a href="#modules">Módulos ERP</a>
              </li>
              <li>
                <a href="#story">Cómo funciona</a>
              </li>
              <li>
                <a href="#demo">Solicitar demo</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <span className="footer-heading" style={{ color: "var(--pink)" }}>
              Accesos
            </span>
            <ul>
              <li>
                <ModuleAccessLink module="project-management" label="Gestión de Proyectos" />
              </li>
              <li>
                <ModuleAccessLink module="quality-control" label="Gestión de Calidad" />
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <span className="footer-heading" style={{ color: "var(--lime)" }}>
              Soporte
            </span>
            <ul>
              <li>
                <a href="#top">Centro de ayuda</a>
              </li>
              <li>
                <a href="#top">Estado del servicio</a>
              </li>
              <li>
                <a href="#top">Documentación</a>
              </li>
            </ul>
          </div>
          <div className="footer-column">
            <span className="footer-heading" style={{ color: "var(--blue)" }}>
              Legal
            </span>
            <ul>
              <li>
                <a href="#top">Privacidad</a>
              </li>
              <li>
                <a href="#top">Términos</a>
              </li>
              <li>
                <a href="#top">Seguridad</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-mark">
          <p className="footer-word">BUSINESS ERP</p>
          <div className="footer-bottom">
            <span>© 2026 bdgestion.org · Business ERP · Todos los derechos reservados</span>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};
