// ============================================================
// validators/ProduccionValidators.ts
// ============================================================

import { z } from 'zod';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

export const produccionGanaderaSchema = z.object({
  id_animal: z
    .number({ required_error: 'Selecciona el animal' })
    .int()
    .positive('El animal no es válido'),
  tipo: z.enum(['LECHE', 'PESO', 'HUEVO', 'CARNE', 'OTRO'], {
    errorMap: () => ({ message: 'El tipo de producción no es válido' }),
  }),
  cantidad: z
    .number({ required_error: 'La cantidad es obligatoria' })
    .positive('La cantidad debe ser mayor que cero'),
  unidad: z
    .string({ required_error: 'La unidad es obligatoria' })
    .trim()
    .min(1, 'Indica la unidad: litros, kg, piezas...')
    .max(30),
  fecha,
  observaciones: z.string().trim().max(500).optional(),
});

export const produccionAgricolaSchema = z.object({
  id_cultivo: z
    .number({ required_error: 'Selecciona el cultivo' })
    .int()
    .positive('El cultivo no es válido'),
  producto: z
    .string({ required_error: 'Indica el producto cosechado' })
    .trim()
    .min(2, 'El producto debe tener al menos 2 caracteres')
    .max(120),
  cantidad: z
    .number({ required_error: 'La cantidad es obligatoria' })
    .positive('La cantidad debe ser mayor que cero'),
  unidad: z
    .string({ required_error: 'La unidad es obligatoria' })
    .trim()
    .min(1, 'Indica la unidad: kg, tonnes, cajas...')
    .max(30),
  fecha_cosecha: fecha,
  observaciones: z.string().trim().max(500).optional(),
});

export const filtrosProduccionSchema = z.object({
  tipo: z.enum(['LECHE', 'PESO', 'HUEVO', 'CARNE', 'OTRO']).optional(),
  id_animal: z.coerce.number().int().positive().optional(),
  dias: z.coerce.number().int().min(1).max(365).optional(),
});
