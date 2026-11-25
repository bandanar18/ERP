import { type Href, useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/**
 * `router.back()` seguro: si no hay pantalla previa en el stack (p.ej. al
 * recargar una ruta interna en web, el stack queda con una sola pantalla),
 * navega al fallback en lugar de tirar el warning "GO_BACK was not handled".
 */
export function goBackSafe(router: Router, fallback: Href = '/pm/explorar') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
