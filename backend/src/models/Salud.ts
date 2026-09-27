// ============================================================
// models/Salud.ts
// Tipos del módulo de salud: vacunas, tratamientos, controles,
// pesajes e incidentes.
//
// A diferencia de otros módulos, aquí hay varias tablas pequeñas
// que se parecen entre sí. Cada una tiene su propio tipo para que
// TypeScript no deje confundir, por ejemplo, una vacuna con un
// tratamiento.
// ============================================================

import { Sexo } from './Animal';

export type TipoControl = 'GENERAL' | 'CLINICO' | 'LABORATORIO' | 'REPRODUCTIVO' | 'OTRO';
export type TipoIncidente = 'LESION' | 'ENFERMEDAD' | 'ACCIDENTE' | 'COMPORTAMIENTO' | 'OTRO';
export type Gravedad = 'LEVE' | 'MODERADA' | 'GRAVE';

/** Evento de salud próximo a vencer (vacuna, tratamiento o control). */
export interface ProximoEvento {
  tipo: 'VACUNA' | 'TRATAMIENTO' | 'CONTROL';
  titulo: string;
  fecha: string;
  dias_restantes: number;
}

/** Forma de la respuesta al registrar un evento de salud. */
export interface EventoRegistrado {
  id: number;
  id_animal: number;
  fecha_creacion: Date;
  /** Estado del Índice del animal DESPUÉS de registrar este evento. */
  estado_indice: string;
}

// Reexportamos Sexo para que otros módulos lo usen desde aquí también
export type { Sexo };
