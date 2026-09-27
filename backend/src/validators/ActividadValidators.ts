// ============================================================
// validators/ActividadValidators.ts
// ============================================================

import { z } from 'zod';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

const hora = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'La hora debe tener el formato HH:MM')
  .optional();

export const crearActividadSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre de la actividad es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre es demasiado largo'),
  descripcion: z.string().trim().max(1000, 'La descripción es demasiado larga').optional(),
  tipo: z.enum(['AGRICOLA', 'GANADERA', 'ADMINISTRATIVA', 'MANTENIMIENTO', 'OTRA'], {
    errorMap: () => ({ message: 'El tipo de actividad no es válido' }),
  }),
  fecha,
  hora,
  responsable: z.number().int().positive().optional(),
  observaciones: z.string().trim().max(500).optional(),
});

export const actualizarActividadSchema = z.object({
  nombre: z.string().trim().min(3).max(150).optional(),
  descripcion: z.string().trim().max(1000).optional(),
  tipo: z.enum(['AGRICOLA', 'GANADERA', 'ADMINISTRATIVA', 'MANTENIMIENTO', 'OTRA']).optional(),
  fecha: fecha.optional(),
  hora,
  responsable: z.number().int().positive().optional(),
  observaciones: z.string().trim().max(500).optional(),
});

export const estadoActividadSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'], {
    errorMap: () => ({ message: 'El estado no es válido' }),
  }),
});

export const filtrosActividadSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA']).optional(),
  tipo: z.enum(['AGRICOLA', 'GANADERA', 'ADMINISTRATIVA', 'MANTENIMIENTO', 'OTRA']).optional(),
  responsable: z.coerce.number().int().positive().optional(),
});
