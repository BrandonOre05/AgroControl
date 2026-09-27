// ============================================================
// validators/SaludValidators.ts
// Esquemas de validación de los eventos de salud.
//
// Además de validar el formato, algunas reglas cruzan campos:
// por ejemplo, la fecha de fin de un tratamiento no puede ser
// anterior a la fecha de inicio.
// ============================================================

import { z } from 'zod';

/** Formato de fecha: AAAA-MM-DD */
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

/** Descripción opcional compartida por varios eventos. */
const descripcion = z.string().trim().max(1000, 'La descripción es demasiado larga').optional();

/** Registro de una vacuna. */
export const vacunaSchema = z
  .object({
    nombre: z
      .string({ required_error: 'El nombre de la vacuna es obligatorio' })
      .trim()
      .min(2, 'El nombre de la vacuna debe tener al menos 2 caracteres')
      .max(120),
    fecha: fecha,
    proxima_fecha: fecha.optional(),
    dosis: z.string().trim().max(60, 'La dosis es demasiado larga').optional(),
    descripcion,
    // Producto de inventario (el descuento de stock llega con el módulo de inventario)
    id_producto: z.number().int().positive().optional(),
  })
  // La próxima fecha no puede ser anterior a la fecha de aplicación
  .refine((datos) => !datos.proxima_fecha || datos.proxima_fecha >= datos.fecha, {
    message: 'La próxima fecha no puede ser anterior a la fecha de la vacuna',
    path: ['proxima_fecha'],
  });

/** Registro de un tratamiento. */
export const tratamientoSchema = z
  .object({
    nombre: z
      .string({ required_error: 'El nombre del tratamiento es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(120),
    fecha_inicio: fecha,
    fecha_fin: fecha.optional(),
    dosis: z.string().trim().max(60, 'La dosis es demasiado larga').optional(),
    descripcion,
    id_producto: z.number().int().positive().optional(),
  })
  .refine((datos) => !datos.fecha_fin || datos.fecha_fin >= datos.fecha_inicio, {
    message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
    path: ['fecha_fin'],
  });

/** Registro de un control o revisión. */
export const controlSchema = z
  .object({
    fecha: fecha,
    tipo: z.enum(['GENERAL', 'CLINICO', 'LABORATORIO', 'REPRODUCTIVO', 'OTRO'], {
      errorMap: () => ({ message: 'El tipo de control no es válido' }),
    }),
    descripcion,
    proxima_fecha: fecha.optional(),
  })
  .refine((datos) => !datos.proxima_fecha || datos.proxima_fecha >= datos.fecha, {
    message: 'La próxima fecha no puede ser anterior a la fecha del control',
    path: ['proxima_fecha'],
  });

/** Registro de un pesaje. */
export const pesajeSchema = z.object({
  peso: z
    .number({ required_error: 'El peso es obligatorio' })
    .positive('El peso debe ser mayor que cero')
    .max(2000, 'El peso no puede superar los 2000 kg'),
  fecha: fecha.optional(),
  descripcion,
});

/** Registro de un incidente. */
export const incidenteSchema = z.object({
  fecha: z.string().datetime({ message: 'La fecha del incidente no es válida' }).optional(),
  tipo: z.enum(['LESION', 'ENFERMEDAD', 'ACCIDENTE', 'COMPORTAMIENTO', 'OTRO'], {
    errorMap: () => ({ message: 'El tipo de incidente no es válido' }),
  }),
  gravedad: z.enum(['LEVE', 'MODERADA', 'GRAVE'], {
    errorMap: () => ({ message: 'La gravedad debe ser LEVE, MODERADA o GRAVE' }),
  }),
  descripcion: z
    .string({ required_error: 'La descripción del incidente es obligatoria' })
    .trim()
    .min(5, 'Describe el incidente con al menos 5 caracteres')
    .max(1000),
  descripcion_extra: descripcion,
  resuelto: z.boolean().optional(),
});
