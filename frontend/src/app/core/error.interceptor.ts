// ============================================================
// core/error.interceptor.ts
// Manejo centralizado de errores de la API.
//
// Si el backend responde 401 (token inválido o expirado), la
// sesión se cierra y se vuelve al login automáticamente.
// Los demás errores solo se registran: cada pantalla muestra su
// propio mensaje.
// ============================================================

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 = token inválido o vencido -> cerrar sesión.
      // Pero si ya estamos en el login, NO volvemos a cerrar sesión:
      // eso crearía un bucle infinito de recargas.
      if (error.status === 401 && !router.url.startsWith('/login')) {
        auth.logout();
      }

      return throwError(() => error);
    }),
  );
};
