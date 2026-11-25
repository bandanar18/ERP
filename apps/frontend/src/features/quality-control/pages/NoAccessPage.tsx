import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useQcAuthStore } from "../store/auth.store";
import { QcAppShell } from "../components/QcAppShell";

export const NoAccessPage = () => {
  const navigate = useNavigate();
  const logout = useQcAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/quality-control/login", { replace: true });
  };

  return (
    <QcAppShell>
      <div className="mx-auto flex max-w-[520px] flex-col items-center rounded-2xl border border-[#dce8e0] bg-white px-8 py-16 text-center shadow-[0_1px_3px_rgba(16,31,25,0.05)]">
        <span className="mb-5 grid size-16 place-items-center rounded-2xl bg-[#fef2f2] text-[#dc2626]">
          <ShieldAlert className="size-8 stroke-[1.6]" />
        </span>
        <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-[#101f19]">
          Sin acceso asignado
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-[#5b7267]">
          Tu cuenta está autenticada, pero aún no tiene un rol asignado en el
          módulo de Gestión de Calidad. Un administrador debe asignarte un rol
          (Responsable de Proceso, Director o Administrador) para que puedas operar.
        </p>
        <button
          onClick={handleLogout}
          className="mt-8 rounded-lg bg-[#059669] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#047857]"
        >
          Cerrar sesión
        </button>
      </div>
    </QcAppShell>
  );
};
