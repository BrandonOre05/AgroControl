// ============================================================
// middlewares/PermisoMiddleware.ts
// Middleware que revisa la MATRIZ DE PERMISOS (config/permisos.ts).
//
// Diferencia con verificarRol:
//   - verificarRol('ADMIN','ENCARGADO') pregunta "¿tienes alguno de estos roles?"
//   - verificarPermiso('animales','crear') pregunta "¿tu rol tiene esta acción?"
//
// El segundo es más flexible: si agregamos un rol nuevo, la matriz
// decide sin tocar las rutas.
// ============================================================

import { NextFunction, Request, Response } from 'express';
import { tienePermiso } from '../config/permisos';
import { AppError } from '../utils/AppError';

/**
 * Exige un permiso concreto.
 * Uso: router.post('/', verificarPermiso('animales', 'crear'), ...)
 */
export function verificarPermiso(modulo: string, accion: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Sin token no hay usuario, y sin usuario no hay permiso
    if (!req.user) {
      throw new AppError('Token no proporcionado', 401);
    }

    if (!tienePermiso(modulo, accion, req.user.rol)) {
      throw new AppError('No tienes permisos para esta acción', 403);
    }

    next();
  };
}
