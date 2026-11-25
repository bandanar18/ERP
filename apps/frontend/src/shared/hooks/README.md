# Sistema de Alertas Toast

Sistema estandarizado de alertas visuales usando SweetAlert2.

## Instalación

Ya está instalado en `package.json`:
```bash
pnpm add sweetalert2
```

## Uso Básico

```tsx
import { useToast } from "@/shared/hooks"

function MyComponent() {
  const toast = useToast()

  const handleSuccess = () => {
    toast.success("Operación exitosa")
  }

  const handleError = () => {
    toast.error("Algo salió mal")
  }

  // ...
}
```

## Casos de Uso Predefinidos

Para mensajes estandarizados, usa `useToastCases`:

```tsx
import { useToastCases } from "@/shared/hooks"

function AuthComponent() {
  const toast = useToastCases()

  // Login
  toast.loginSuccess()      // "¡Bienvenido! Has iniciado sesión correctamente"
  toast.loginError()        // Mensaje de error genérico
  toast.loginError("Email o contraseña incorrectos")

  // Registro
  toast.registerSuccess()   // "¡Cuenta creada! Revisá tu correo para verificarla"
  toast.registerError()

  // Verificación
  toast.verificationSuccess()
  toast.codeSent()

  // Contraseña
  toast.passwordResetSent()
  toast.passwordMismatch()
  toast.passwordWeak()

  // CRUD
  toast.createSuccess("Producto")
  toast.updateSuccess("Usuario")
  toast.deleteSuccess("Post")

  // Errores genéricos
  toast.networkError()
  toast.serverError()
  toast.accessDenied()

  // Custom
  toast.custom("success", "Título", "Descripción opcional")
}
```

## API

### useToast()

| Método | Parámetros | Descripción |
|--------|------------|-------------|
| `success()` | `title: string, options?` | Alerta verde de éxito |
| `error()` | `title: string, options?` | Alerta roja de error |
| `warning()` | `title: string, options?` | Alerta amarilla de advertencia |
| `info()` | `title: string, options?` | Alerta azul informativa |
| `question()` | `title: string, options?` | Alerta de pregunta |

### useToastCases()

Casos predefinidos para escenarios comunes. Ver lista completa arriba.

### ToastOptions

```tsx
interface ToastOptions {
  title?: string      // Título del mensaje
  text?: string       // Descripción opcional
  icon?: SweetAlertIcon // Icono personalizado
  timer?: number      // Duración en ms (default: 3000)
}
```

## Ejemplos de Uso

### Con descripción
```tsx
toast.success("Guardado", { text: "Los cambios se aplicaron correctamente" })
toast.error("Error", { text: "No se pudo conectar al servidor", timer: 5000 })
```

### Timer personalizado
```tsx
toast.info("Procesando...", { timer: 10000 })
```

### Loading (sin timer)
```tsx
const { show } = toast
show("info", { title: "Cargando...", timer: 0 })
```

## Estilos

Los estilos se cargan en `main.tsx`:
```tsx
import 'sweetalert2/src/sweetalert2.scss'
```

Para personalizar colores, edita tus variables CSS o sobrescribe los estilos de SweetAlert2.
