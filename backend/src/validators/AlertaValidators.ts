// ============================================================
// validators/AlertaValidators.ts
// Esquemas de validación del módulo de alertas.
// ============================================================

import { z } from 'zod';

/** Filtros del listado de alertas (query string). */
export const filtrosAlertaSchema = z.object({
  estado: z.enum(['ACTIVA', 'RESUELTA', 'IGNORADA']).optional(),
  severidad: z.enum(['INFORMATIVA', 'ADVERTENCIA', 'CRITICA']).optional(),
  tipo: z
    .enum([
      'VACUNA_PROXIMA',
      'CONTROL_PENDIENTE',
      'TRATAMIENTO_PENDIENTE',
      'INVENTARIO_BAJO',
      'ACTIVIDAD_PENDIENTE',
      'COSECHA_PROXIMA',
      'ALIMENTACION_PENDIENTE',
      'ANIMAL_OBSERVACION',
    ])
    .optional(),
});

/** Resolver o ignorar una alerta. */
export const resolverAlertaSchema = z.object({
  estado: z.enum(['RESUELTA', 'IGNORADA'], {
    errorMap: () => ({ message: 'El estado debe ser RESUELTA o IGNORADA' }),
  }),
});
