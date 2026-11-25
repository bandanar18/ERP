import { useToast } from "./useToast"

/**
 * Casos de uso predefinidos para alertas toast
 * Estandariza los mensajes comunes de la aplicación
 */
export const useToastCases = () => {
  const toast = useToast()

  return {
    // AUTH - Login
    loginSuccess: () =>
      toast.success("¡Bienvenido! Has iniciado sesión correctamente"),

    loginError: (message?: string) =>
      toast.error(message || "No se pudo iniciar sesión. Verifica tus credenciales"),

    // AUTH - Registro
    registerSuccess: () =>
      toast.success("¡Cuenta creada! Revisa tu correo para verificarla"),

    registerError: (message?: string) =>
      toast.error(message || "No se pudo crear la cuenta. Intenta de nuevo"),

    rateLimitError: (message?: string) =>
      toast.warning(message || "Demasiados intentos. Espera unos minutos."),

    // AUTH - Verificación
    verificationSuccess: () =>
      toast.success("¡Cuenta verificada! Ya puedes iniciar sesión"),

    verificationError: (message?: string) =>
      toast.error(message || "Código inválido o expirado"),

    codeSent: () =>
      toast.success("Código enviado. Revisa tu correo"),

    // AUTH - Recuperar contraseña
    passwordResetSent: () =>
      toast.info("Revisa tu correo para restablecer tu contraseña"),

    passwordResetSuccess: () =>
      toast.success("Contraseña restablecida con éxito"),

    passwordResetError: () =>
      toast.error("No se pudo restablecer la contraseña"),

    // FORMULARIOS - Validación
    formError: (field?: string) =>
      toast.error(field ? `El campo ${field} es inválido` : "Corrige los errores del formulario"),

    formSuccess: (message?: string) =>
      toast.success(message || "Guardado correctamente"),

    // FORMULARIOS - Campos requeridos
    requiredField: (field: string) =>
      toast.warning(`${field} es requerido`),

    // FORMULARIOS - Contraseñas
    passwordMismatch: () =>
      toast.warning("Las contraseñas no coinciden"),

    passwordWeak: () =>
      toast.warning("La contraseña es muy débil"),

    // API - Errores genéricos
    networkError: () =>
      toast.error("Error de conexión. Verifica tu internet"),

    serverError: () =>
      toast.error("Error del servidor. Intenta más tarde"),

    // ACCIONES - CRUD
    createSuccess: (item: string) =>
      toast.success(`${item} creado correctamente`),

    updateSuccess: (item: string) =>
      toast.success(`${item} actualizado correctamente`),

    deleteSuccess: (item: string) =>
      toast.success(`${item} eliminado correctamente`),

    // ACCIONES - Errores CRUD
    createError: (item: string) =>
      toast.error(`No se pudo crear ${item}`),

    updateError: (item: string) =>
      toast.error(`No se pudo actualizar ${item}`),

    deleteError: (item: string) =>
      toast.error(`No se pudo eliminar ${item}`),

    // PERMISOS
    accessDenied: () =>
      toast.warning("No tienes permiso para realizar esta acción"),

    sessionExpired: () =>
      toast.warning("Tu sesión expiró. Inicia sesión nuevamente"),

    // ARCHIVOS
    fileUploadSuccess: () =>
      toast.success("Archivo subido correctamente"),

    fileUploadError: () =>
      toast.error("No se pudo subir el archivo"),

    // GENERICOS
    loading: (message: string = "Procesando...") => {
      const { show } = toast
      return show("info", { title: message, timer: 0 })
    },

    custom: (type: "success" | "error" | "warning" | "info", title: string, text?: string) => {
      return toast[type](title, { text })
    }
  }
}
