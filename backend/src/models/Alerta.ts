// ============================================================
// models/Alerta.ts
// Tipos del sistema de alertas.
// ============================================================

export type TipoAlerta =
  | 'VACUNA_PROXIMA'
  | 'CONTROL_PENDIENTE'
  | 'TRATAMIENTO_PENDIENTE'
  | 'INVENTARIO_BAJO'
  | 'ACTIVIDAD_PENDIENTE'
  | 'COSECHA_PROXIMA'
  | 'ALIMENTACION_PENDIENTE'
  | 'ANIMAL_OBSERVACION';

export type Severidad = 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA';
export type EstadoAlerta = 'ACTIVA' | 'RESUELTA' | 'IGNORADA';

/** Alerta tal como se guarda y se devuelve en la API. */
export interface Alerta {
  id_alerta: number;
  id_finca: number;
  tipo: TipoAlerta;
  severidad: Severidad;
  mensaje: string;
  // Referencias opcionales al registro que la originó
  id_animal: number | null;
  id_producto: number | null;
  id_cultivo: number | null;
  id_actividad: number | null;
  fecha_deteccion: Date;
  estado: EstadoAlerta;
  fecha_resolucion: Date | null;
  resuelta_por: number | null;
}

/**
 * Alerta "en construcción" antes de guardarse.
 * La clave permite saber si ya existe una alerta igual activa
 * y así no duplicar la misma alerta en cada recálculo.
 */
export interface AlertaCandidata {
  tipo: TipoAlerta;
  severidad: Severidad;
  mensaje: string;
  id_animal?: number | null;
  id_producto?: number | null;
  id_cultivo?: number | null;
  id_actividad?: number | null;
  /** Identificador único de la alerta: tipo + referencia */
  clave: string;
}

/** Filtros opcionales del listado de alertas. */
export interface FiltrosAlerta {
  estado?: EstadoAlerta;
  severidad?: Severidad;
  tipo?: TipoAlerta;
}
