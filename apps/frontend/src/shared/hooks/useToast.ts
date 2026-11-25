import Swal, { type SweetAlertIcon, type SweetAlertResult } from "sweetalert2"

type ToastType = "success" | "error" | "warning" | "info" | "question"

export interface ToastOptions {
  title?: string
  text?: string
  icon?: SweetAlertIcon
  timer?: number
}

export const useToast = () => {
  const show = (type: ToastType, options: ToastOptions = {}): Promise<SweetAlertResult<any>> => {
    const toast = Swal.fire({
      toast: true,
      position: "top-end",
      icon: options.icon || type,
      title: options.title,
      text: options.text,
      showConfirmButton: false,
      timer: options.timer || 2000,
      timerProgressBar: true,
      didOpen: (_toast) => {
        // Forzar cierre después del timer
        setTimeout(() => {
          Swal.close()
        }, options.timer || 2000)
      }
    })

    return toast
  }

  return {
    success: (title: string, options?: Omit<ToastOptions, "icon">) =>
      show("success", { ...options, title }),

    error: (title: string, options?: Omit<ToastOptions, "icon">) =>
      show("error", { ...options, title }),

    warning: (title: string, options?: Omit<ToastOptions, "icon">) =>
      show("warning", { ...options, title }),

    info: (title: string, options?: Omit<ToastOptions, "icon">) =>
      show("info", { ...options, title }),

    question: (title: string, options?: Omit<ToastOptions, "icon">) =>
      show("question", { ...options, title }),

    show
  }
}

// Alias para export directa
export const toast = () => {
  const t = useToast()
  return t
}
