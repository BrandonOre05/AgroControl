// ============================================================
// validators/AlimentacionValidators.ts
// ============================================================

import { z } from 'zod';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

const hora = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'La hora debe tener el formato HH:MM')
  .optional();

export const crearAlimentacionSchema = z
  .object({
    id_animal: z.number().int().positive().nullable().optional(),
    grupo: z.string().trim().max(100, 'El nombre del grupo es demasiado largo').nullable().optional(),
    id_producto: z.number().int().positive().nullable().optional(),
    tipo_alimento: z
      .string({ required_error: 'Indica qué alimento se dio' })
      .trim()
      .min(2, 'El alimento debe tener al menos 2 caracteres')
      .max(120),
    cantidad: z
      .number({ required_error: 'La cantidad es obligatoria' })
      .positive('La cantidad debe ser mayor que cero'),
    unidad: z
      .string({ required_error: 'La unidad es obligatoria' })
      .trim()
      .min(1, 'Indica la unidad: kg, sacos, litros...')
      .max(30),
    fecha,
    hora,
    observaciones: z.string().trim().max(500).optional(),
  })
  // Tiene que ser para un animal O para un grupo, nunca ninguno
  .refine((d) => !!d.id_animal || !!d.grupo, {
    message: 'Elige un animal o escribe el nombre del grupo',
    path: ['grupo'],
  });

export const filtrosAlimentacionSchema = z.object({
  id_animal: z.coerce.number().int().positive().optional(),
  dias: z.coerce.number().int().min(1).max(365).optional(),
  limite: z.coerce.number().int().min(1).max(200).optional(),
});
