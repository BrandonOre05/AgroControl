// ============================================================
// validators/UsuarioValidators.ts
// Esquemas de validación del CRUD de usuarios.
// ============================================================

import { z } from 'zod';
import { passwordSchema } from './AuthValidators';

/** Crear usuario (reutiliza la política de contraseñas). */
export const crearUsuarioSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido'),
  password: passwordSchema,
  rol: z.enum(['ADMIN', 'ENCARGADO', 'TRABAJADOR'], {
    errorMap: () => ({ message: 'El rol debe ser ADMIN, ENCARGADO o TRABAJADOR' }),
  }),
  telefono: z.string().trim().max(20, 'El teléfono es demasiado largo').optional(),
});

/** Actualizar datos básicos (no incluye rol ni contraseña). */
export const actualizarUsuarioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .optional(),
  telefono: z.string().trim().max(20, 'El teléfono es demasiado largo').optional(),
});

/** Cambio de rol. */
export const rolSchema = z.object({
  rol: z.enum(['ADMIN', 'ENCARGADO', 'TRABAJADOR'], {
    errorMap: () => ({ message: 'El rol debe ser ADMIN, ENCARGADO o TRABAJADOR' }),
  }),
});

/** Cambio de estado. */
export const estadoUsuarioSchema = z.object({
  estado: z.enum(['ACTIVO', 'INACTIVO', 'SUSPENDIDO'], {
    errorMap: () => ({ message: 'El estado debe ser ACTIVO, INACTIVO o SUSPENDIDO' }),
  }),
});

/** Cambio de contraseña. */
export const cambiarPasswordSchema = z.object({
  password: passwordSchema,
});
