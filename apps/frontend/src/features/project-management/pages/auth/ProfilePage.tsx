import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, KeyRound, Shield, Save, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth.api";
import { usePmAuthStore } from "../../store/auth.store";
import { toast } from "sonner";
import { PmAppShell } from "../../components/PmAppShell";
import { cn } from "@/lib/utils";

export function ProfilePage() {
  const { user, updateUser } = usePmAuthStore();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    phone: user?.phone || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const updatedUser = await authApi.updateProfile({
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        username: form.username.trim() || null,
        phone: form.phone.trim() || null,
      });

      updateUser(updatedUser);
      setIsSuccess(true);
      toast.success("Perfil y teléfono actualizados correctamente");
    } catch (err: any) {
      const message = err.message || "No se pudo actualizar el perfil";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-none border border-[#e5ddd5] bg-white px-[14px] text-[15px] font-medium text-[#111416] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#a8a29e] focus:border-[#d9772f] focus:shadow-[0_0_0_3px_rgba(217,119,47,0.12)] disabled:bg-[#f7f4ef] disabled:text-[#8d918f]";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-[#111416]";

  const roleText = (() => {
    if (!user?.roles || user.roles.length === 0) return "Usuario";
    if (user.roles.includes("PM_ADMIN")) return "Administrador PM";
    if (user.roles.includes("PM_GESTION")) return "Gestión";
    if (user.roles.includes("PM_PLANIFICADOR")) return "Planificador";
    if (user.roles.includes("PM_DIRECCION")) return "Dirección / Cliente";
    if (user.roles.includes("PM_ADMIN_FINANCIERO")) return "Admin Financiero";
    return user.roles[0];
  })();

  return (
    <PmAppShell
      crumb={
        <>
          Inicio <span aria-hidden="true">/</span> <strong className="text-[#111416]">Mi perfil</strong>
        </>
      }
    >
      <div className="mx-auto max-w-[620px]">
        {/* Cabecera */}
        <div className="mb-5 text-center">
          <p className="mb-[4px] text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9561d]">
            Cuenta de usuario
          </p>
          <h1 id="page-title" className="font-display mb-1 text-[clamp(28px,3vw,40px)] font-normal leading-[0.9] tracking-[0.01em]">
            Mi perfil
          </h1>
          <p className="text-[12px] text-[#4e5558]">
            Gestiona tu información personal, datos de contacto y seguridad.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="border border-[#d8d0c4] bg-[#fffdf9] p-6 shadow-[0_24px_50px_rgba(28,15,8,0.12)] max-[600px]:p-5"
        >
          {/* Card encabezado con avatar y rol */}
          <div className="mb-6 flex items-center justify-between border-b border-[#d8d0c4] pb-5">
            <div className="flex items-center gap-3.5">
              <div className="grid size-12 place-items-center rounded-none bg-[#d9772f]/10 text-[#d9772f]">
                <User className="h-6 w-6 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-[17px] font-bold tracking-[-0.02em] text-[#111416]">
                  {form.firstName || form.lastName
                    ? `${form.firstName} ${form.lastName}`.trim()
                    : user?.email || "Usuario"}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-[#d9772f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    <Shield className="h-3 w-3" />
                    {roleText}
                  </span>
                </div>
              </div>
            </div>
            {isSuccess && (
              <div className="flex items-center gap-1.5 rounded bg-[#4c9b7a]/15 px-2.5 py-1 text-[11px] font-bold text-[#4c9b7a]">
                <CheckCircle2 className="h-4 w-4" />
                Actualizado
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClass}>
                  Nombre
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="lastName" className={labelClass}>
                  Apellido
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Tu apellido"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="username" className={labelClass}>
                Nombre de usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="alias de usuario"
                autoCapitalize="none"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="phone" className={labelClass}>
                Número de teléfono
              </label>
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+584121234567"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  disabled={isLoading}
                  className={cn(inputClass, "pl-10")}
                />
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4e5558]" />
              </div>
              <p className="mt-1 text-[11px] text-[#4e5558]">
                Número de contacto directo para comunicaciones y proyectos vinculados.
              </p>
            </div>

            <div className="mt-4">
              <label className={labelClass}>Correo electrónico</label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className={cn(inputClass, "pl-10")}
                />
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d918f]" />
              </div>
              <p className="mt-1 text-[11px] text-[#8d918f]">
                El correo electrónico no se puede modificar directamente porque identifica tu cuenta.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 border border-[#d9772f] bg-[#d9772f] px-[15px] text-[14px] font-bold text-white transition-colors hover:border-[#b9561d] hover:bg-[#b9561d] disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </button>

              <Link
                to="/project-management/cambiar-contrasena"
                className="flex min-h-[42px] w-full items-center justify-center gap-2 border border-[#d8d0c4] bg-white px-[15px] text-[13px] font-bold text-[#111416] transition-colors hover:bg-[#f7f4ef]"
              >
                <KeyRound className="h-4 w-4 text-[#b9561d]" />
                Cambiar contraseña
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </PmAppShell>
  );
}
