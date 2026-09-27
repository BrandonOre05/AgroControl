// ============================================================
// validators/CultivoValidators.ts
// Esquemas de validación de cultivos y actividades agrícolas.
// ============================================================

import { z } from 'zod';

/** Formato de fecha: AAAA-MM-DD */
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

export const crearCultivoSchema = z
  .object({
    nombre: z
      .string({ required_error: 'El nombre del cultivo es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120, 'El nombre es demasiado largo'),
    tipo: z.string().trim().max(80, 'El tipo es demasiado largo').optional(),
    area: z
      .number({ invalid_type_error: 'El área debe ser un número' })
      .positive('El área debe ser mayor que cero')
      .max(10000, 'El área parece incorrecta')
      .optional(),
    fecha_siembra: fecha,
    fecha_cosecha_estimada: fecha.optional(),
    ubicacion: z.string().trim().max(150, 'La ubicación es demasiado larga').optional(),
    observaciones: z.string().trim().max(1000, 'Las observaciones son demasiado largas').optional(),
  })
  // La cosecha no puede<Date antes de la siembra
  .refine((d) => !d.fecha_cosecha_estimada || d.fecha_cosecha_estimada >= d.fecha_siembra, {
    message: 'La fecha de cosecha no puede ser anterior a la fecha de siembra',
    path: ['fecha_cosecha_estimada'],
  });

export const actualizarCultivoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120).optional(),
  tipo: z.string().trim().max(80).optional(),
  area: z
    .number({ invalid_type_error: 'El área debe ser un número' })
    .positive('El área debe ser mayor que cero')
    .optional(),
  fecha_siembra: fecha.optional(),
  fecha_cosecha_estimada: fecha.optional(),
  ubicacion: z.string().trim().max(150).optional(),
  observaciones: z.string().trim().max(1000).optional(),
});

export const etapaCultivoSchema = z.object({
  etapa: z.enum(
    ['PREPARACION', 'SIEMBRA', 'CRECIMIENTO', 'MANTENIMIENTO', 'COSECHA', 'FINALIZADA'],
    { errorMap: () => ({ message: 'La etapa no es válida' }) }
  ),
});

export const estadoCultivoSchema = z.object({
  estado: z.enum(['ACTIVO', 'FINALIZADO', 'CANCELADO'], {
    errorMap: () => ({ message: 'El estado no es válido' }),
  }),
});

export const actividadAgricolaSchema = z
  .object({
    fecha: fecha,
    tipo: z.enum(
      [
        'PREPARACION',
        'SIEMBRA',
        'RIEGO',
        'FERTILIZACION',
        'CONTROL_PLAGAS',
        'MANTENIMIENTO',
        'COSECHA',
        'OTRA',
      ],
      { errorMap: () => ({ message: 'El tipo de actividad no es válido' }) }
    ),
    descripcion: z.string().trim().max(1000, 'La descripción es demasiado larga').optional(),
    estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA']).optional(),
    observaciones: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.descripcion && d.descripcion.length >= 5, {
    message: 'Describe la actividad con al menos 5 caracteres',
    path: ['descripcion'],
  });

export const filtrosCultivoSchema = z.object({
  etapa: z
    .enum(['PREPARACION', 'SIEMBRA', 'CRECIMIENTO', 'MANTENIMIENTO', 'COSECHA', 'FINALIZADA'])
    .optional(),
  estado: z.enum(['ACTIVO', 'FINALIZADO', 'CANCELADO']).optional(),
  texto: z.string().trim().max(100).optional(),
});
