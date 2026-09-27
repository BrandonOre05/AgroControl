// ============================================================
// models/Alimentacion.ts
// Tipos del módulo de alimentación.
//
// La alimentación puede registrarse para UN animal o para un
// grupo/lote completo. Nunca se pueden dejar ambos vacíos.
// ============================================================

export interface Alimentacion {
  id_alimentacion: number;
  id_animal: number | null;
  codigo_animal: string | null;
  grupo: string | null;
  id_producto: number | null;
  nombre_producto: string | null;
  tipo_alimento: string;
  cantidad: number;
  unidad: string;
  fecha: string;
  hora: string | null;
  responsable: string | null;
  observaciones: string | null;
}

export interface DatosAlimentacion {
  id_animal?: number | null;
  grupo?: string | null;
  id_producto?: number | null;
  tipo_alimento: string;
  cantidad: number;
  unidad: string;
  fecha: string;
  hora?: string;
  observaciones?: string;
}

export interface FiltrosAlimentacion {
  id_animal?: number;
  dias?: number;
  limite?: number;
}
