// ============================================================
// models/Auth.ts
// Tipos relacionados con la autenticación (inicio de sesión).
// ============================================================

import { Rol } from './Usuario';

/**
 * Contenido del token JWT.
 * Se guarda lo MÍNIMO necesario: si el usuario cambia de rol,
 * el token expira solo (1h) y vuelve a iniciar sesión.
 */
export interface JwtPayload {
  id_usuario: number;
  rol: Rol;
  nombre: string;
}

/** Respuesta que devuelve POST /api/auth/login. */
export interface RespuestaLogin {
  token: string;
  rol: Rol;
  usuario: {
    id_usuario: number;
    nombre: string;
    correo: string;
  };
}
