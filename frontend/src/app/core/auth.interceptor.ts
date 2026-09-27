// ============================================================
// core/auth.interceptor.ts
// Añade el token JWT a TODAS las peticiones hacia nuestra API.
//
// Se registra una sola vez en app.config.ts, así que no hay que
// acordarse de hacerlo en cada servicio.
// ============================================================

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // Solo a nuestra API, y solo si hay token
  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
