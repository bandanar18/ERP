# Business ERP App 📱

App móvil del **Business ERP** construida con [Expo](https://expo.dev) (SDK 57, expo-router, React Native 0.86). Vive dentro del monorepo pnpm + Turborepo como `apps/business-erp-app`.

## Comandos

Desde la **raíz del monorepo**:

```bash
pnpm mobile            # expo start (menu interactivo: a=android, i=ios, w=web)
pnpm mobile:web        # expo start --web
pnpm mobile:android    # expo start --android (requiere emulador o Expo Go)
pnpm mobile:ios        # expo start --ios (solo macOS)
pnpm mobile:typecheck  # tsc --noEmit
pnpm mobile:build      # expo export (bundle web estático en dist/)
```

O dentro del directorio del app con pnpm directamente.

## Configuración

1. **Variables de entorno**: copia `apps/business-erp-app/.env.example` a `.env` y ajusta `EXPO_PUBLIC_API_URL`:

   | Dónde corres la app | `EXPO_PUBLIC_API_URL` |
   |---|---|
   | Web / iOS simulator / emulador con `adb reverse` | `http://localhost:3000` |
   | Android emulator (sin `adb reverse`) | `http://10.0.2.2:3000` |
   | Dispositivo físico (Expo Go) | `http://<IP-de-tu-máquina>:3000` |

2. **Backend**: levanta la API del monorepo con `pnpm --filter backend dev` (puerto 3000).

## Estructura

```
src/
  app/            # Rutas (expo-router): index.tsx (Inicio), explore.tsx (Explorar), _layout.tsx
  components/     # Componentes del template (themed, tabs, animated-icon)
  constants/      # Colores, tipografías, espaciados
  hooks/          # use-color-scheme, use-theme
  lib/api.ts      # API client tipado contra el backend del ERP (health + auth)
```

El **API client** (`src/lib/api.ts`) usa `EXPO_PUBLIC_API_URL` como base y expone helpers `api.get/post/put/patch/delete` tipados con manejo de errores (`ApiError`) y timeout. La pantalla Inicio muestra el estado de conexión al backend como ejemplo de uso.

## Recursos

- [Documentación de Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router](https://docs.expo.dev/router/introduction)
- [Monorepos en Expo](https://docs.expo.dev/guides/monorepos/)
