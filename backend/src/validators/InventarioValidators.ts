// ============================================================
// validators/InventarioValidators.ts
// Esquemas de validación del inventario.
// ============================================================

import { z } from 'zod';

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD');

export const crearProductoSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del producto es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre es demasiado largo'),
  categoria: z.enum(
    ['ALIMENTO', 'MEDICAMENTO', 'VACUNA', 'FERTILIZANTE', 'SEMILLA', 'HERRAMIENTA', 'OTRO'],
    { errorMap: () => ({ message: 'La categoría no es válida' }) }
  ),
  unidad: z
    .string({ required_error: 'La unidad de medida es obligatoria' })
    .trim()
    .min(1, 'Indica la unidad: kg, L, unités...')
    .max(30),
  stock_actual: z
    .number({ required_error: 'La cantidad inicial es obligatoria' })
    .min(0, 'La cantidad no puede ser negativa'),
  stock_minimo: z.number().min(0, 'El mínimo no puede ser negativo').optional(),
  fecha_vencimiento: fecha.optional(),
  observaciones: z.string().trim().max(500).optional(),
});

export const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120).optional(),
  unidad: z.string().trim().min(1).max(30).optional(),
  stock_minimo: z.number().min(0, 'El mínimo no puede ser negativo').optional(),
  fecha_vencimiento: fecha.nullable().optional(),
  observaciones: z.string().trim().max(500).optional(),
});

export const movimientoSchema = z
  .object({
    tipo: z.enum(['ENTRADA', 'SALIDA', 'AJUSTE'], {
      errorMap: () => ({ message: 'El tipo debe ser ENTRADA, SALIDA o AJUSTE' }),
    }),
    cantidad: z
      .number({ required_error: 'La cantidad es obligatoria' })
      .positive('La cantidad debe ser mayor que cero'),
    motivo: z.string().trim().max(200, 'El motivo es demasiado largo').optional(),
    observaciones: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.tipo !== 'SALIDA' || !!d.motivo, {
    message: 'Indica el motivo de la salida',
    path: ['motivo'],
  });

export const filtrosProductoSchema = z.object({
  categoria: z
    .enum(['ALIMENTO', 'MEDICAMENTO', 'VACUNA', 'FERTILIZANTE', 'SEMILLA', 'HERRAMIENTA', 'OTRO'])
    .optional(),
  estado: z.enum(['DISPONIBLE', 'BAJO', 'AGOTADO', 'VENCIDO']).optional(),
  texto: z.string().trim().max(100).optional(),
});
