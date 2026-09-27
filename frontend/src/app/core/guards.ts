// ============================================================
// core/guards.ts
// Guardas de rutas: deciden si el usuario puede ver una pantalla.
//
//  authGuard    -> ¿hay sesión iniciada?
//  permisoGuard -> ¿su rol tiene permiso para esta acción?
//
// No es la única barrera de seguridad (el backend también valida),
// pero evita mostrar pantallas que el usuario no puede usar.
// ============================================================

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Solo permite entrar si hay token. Si no, manda al login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return true; // Deja pasar
  }

  return router.createUrlTree(['/login']); // Manda al login
};

/**
 * Revisa un permiso de la matriz.
 * Se usa en la ruta: canActivate: [permisoGuard('usuarios', 'ver')]
 */
export function permisoGuard(modulo: string, accion: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.puede(modulo, accion)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']); // No tiene permiso
  };
}
