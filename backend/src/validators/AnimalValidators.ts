// ============================================================
// validators/AnimalValidators.ts
// Esquemas de validación del módulo de animales.
// ============================================================

import { z } from 'zod';

/** Formato de fecha: AAAA-MM-DD (así se guarda en MySQL). */
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

/** Datos para registrar un animal. */
export const crearAnimalSchema = z.object({
  codigo: z
    .string({ required_error: 'El código es obligatorio' })
    .trim()
    .min(1, 'El código es obligatorio')
    .max(30, 'El código no puede superar los 30 caracteres'),
  nombre: z.string().trim().max(80, 'El nombre es demasiado largo').optional(),
  especie: z
    .string({ required_error: 'La especie es obligatoria' })
    .trim()
    .min(2, 'La especie debe tener al menos 2 caracteres')
    .max(60, 'La especie es demasiado larga'),
  raza: z.string().trim().max(60, 'La raza es demasiado larga').optional(),
  sexo: z.enum(['MACHO', 'HEMBRA'], {
    errorMap: () => ({ message: 'El sexo debe ser MACHO o HEMBRA' }),
  }),
  fecha_nacimiento: fecha.optional(),
  fecha_ingreso: fecha,
  ubicacion_finca: z.string().trim().max(100, 'La ubicación es demasiado larga').optional(),
  observaciones: z.string().trim().max(1000, 'Las observaciones son demasiado largas').optional(),
});

/** Datos para actualizar un animal (todos opcionales). */
export const actualizarAnimalSchema = z.object({
  nombre: z.string().trim().max(80, 'El nombre es demasiado largo').optional(),
  especie: z
    .string()
    .trim()
    .min(2, 'La especie debe tener al menos 2 caracteres')
    .max(60, 'La especie es demasiado larga')
    .optional(),
  raza: z.string().trim().max(60, 'La raza es demasiado larga').optional(),
  sexo: z.enum(['MACHO', 'HEMBRA']).optional(),
  fecha_nacimiento: fecha.optional(),
  fecha_ingreso: fecha.optional(),
  ubicacion_finca: z.string().trim().max(100, 'La ubicación es demasiado larga').optional(),
  observaciones: z.string().trim().max(1000, 'Las observaciones son demasiado largas').optional(),
});

/** Cambio de estado del animal (borrado lógico). */
export const estadoAnimalSchema = z.object({
  estado: z.enum(['ACTIVO', 'VENDIDO', 'FALECIDO', 'TRANSFERIDO'], {
    errorMap: () => ({ message: 'El estado no es válido' }),
  }),
});

/** Filtros del listado (query string). */
export const filtrosAnimalSchema = z.object({
  estado_indice: z.enum(['OPTIMO', 'OBSERVACION', 'ATENCION']).optional(),
  estado_animal: z.enum(['ACTIVO', 'VENDIDO', 'FALECIDO', 'TRANSFERIDO']).optional(),
  especie: z.string().trim().max(60).optional(),
  texto: z.string().trim().max(100).optional(),
});
