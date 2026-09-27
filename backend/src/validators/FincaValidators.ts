// ============================================================
// validators/FincaValidators.ts
// Esquemas de validación de la finca.
// ============================================================

import { z } from 'zod';

/** Formato de fecha: AAAA-MM-DD */
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

export const crearFincaSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la finca es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(120, 'El nombre es demasiado largo'),
  ubicacion: z.string().trim().max(200, 'La ubicación es demasiado larga').optional(),
  extension: z
    .number({ invalid_type_error: 'La extensión debe ser un número' })
    .positive('La extensión debe ser mayor que cero')
    .optional(),
  descripcion: z.string().trim().max(1000, 'La descripción es demasiado larga').optional(),
  tipo_produccion: z.enum(['AGRICOLA', 'GANADERA', 'MIXTA']).optional(),
  contacto_telefono: z.string().trim().max(20, 'El teléfono es demasiado largo').optional(),
  contacto_correo: z
    .string()
    .trim()
    .email('El correo de contacto no es válido')
    .optional(),
  fecha_creacion: fecha.optional(), // No se usa aún, se deja por si se requiere
});
