// ============================================================
// middlewares/AuthMiddleware.ts
// Middlewares de seguridad que se ejecutan ANTES de las rutas
// protegidas.
//
//  verificarToken -> ¿la petición trae un token válido?
//  verificarRol   -> ¿el usuario tiene permiso para esta ruta?
//
// Nota: ocultar botones en el frontend NO es seguridad. La
// autoridad real siempre está aquí, en el backend.
// ============================================================

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../models/Auth';
import { Rol } from '../models/Usuario';
import { AppError } from '../utils/AppError';

// Añadimos `user` al objeto Request de Express para poder usarlo
// en las rutas (req.user) después de validar el token.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Exige un token JWT válido.
 * Uso: router.get('/perfil', verificarToken, ...)
 */
export function verificarToken(req: Request, _res: Response, next: NextFunction) {
  // El token debe venir en la cabecera: Authorization: Bearer <token>
  const cabecera = req.headers.authorization;

  if (!cabecera?.startsWith('Bearer ')) {
    throw new AppError('Token no proporcionado', 401);
  }

  const token = cabecera.split(' ')[1];

  try {
    // Verifica la firma y que no esté expirado
    req.user = jwt.verify(token, env.jwtSecret) as JwtPayload;
    next();
  } catch {
    throw new AppError('Token inválido o expirado', 401);
  }
}

/**
 * Exige que el usuario tenga uno de los roles indicados.
 * Uso: router.get('/', verificarToken, verificarRol('ADMIN'), ...)
 */
export function verificarRol(...rolesPermitidos: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Token no proporcionado', 401);
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      throw new AppError('No tienes permisos para esta acción', 403);
    }

    next();
  };
}
