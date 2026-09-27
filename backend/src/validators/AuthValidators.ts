// ============================================================
// validators/AuthValidators.ts
// Esquemas de validación (Zod) del módulo de autenticación.
// Cada esquema define qué campos se reciben y qué reglas deben
// cumplir: tipo, largo, formato, obligatoriedad...
// ============================================================

import { z } from 'zod';

/** Datos del inicio de sesión. */
export const loginSchema = z.object({
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

/**
 * Política de contraseñas de AgroControl.
 * Se reutiliza al crear usuarios y al cambiar contraseñas.
 */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-ZÁÉÍÓÚÑ]/, 'La contraseña debe incluir una letra mayúscula')
  .regex(/[a-záéíóúñ]/, 'La contraseña debe incluir una letra minúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir un número');

/**
 * Edición del perfil propio.
 * NO se puede cambiar el correo ni el rol desde aquí: el correo
 * identifica la cuenta y el rol solo lo asigna el administrador.
 */
export const actualizarPerfilSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .optional(),
  telefono: z
    .string()
    .trim()
    .max(20, 'El teléfono es demasiado largo')
    .optional(),
});

/**
 * Cambio de contraseña propia.
 * Se pide la actual (para confirmar que eres tú) y la nueva, que
 * debe cumplir la misma política de contraseñas.
 */
export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, 'Escribe tu contraseña actual'),
    passwordNuevo: passwordSchema,
  })
  // Que la nueva sea distinta de la actual
  .refine((d) => d.passwordActual !== d.passwordNuevo, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['passwordNuevo'],
  });

/** Datos para crear un usuario (lo usará el administrador). */
export const crearUsuarioSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
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
