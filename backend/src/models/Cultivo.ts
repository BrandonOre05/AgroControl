// ============================================================
// models/Cultivo.ts
// Tipos del módulo de cultivos y sus actividades.
// ============================================================

/** Etapas del ciclo de producción de un cultivo. */
export type EtapaCultivo =
  | 'PREPARACION'
  | 'SIEMBRA'
  | 'CRECIMIENTO'
  | 'MANTENIMIENTO'
  | 'COSECHA'
  | 'FINALIZADA';

export type EstadoCultivo = 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';

/** Cultivo tal como lo devuelve la API. */
export interface Cultivo {
  id_cultivo: number;
  id_finca: number;
  nombre: string;
  tipo: string | null;
  area: number | null; // Hectáreas
  fecha_siembra: string;
  fecha_cosecha_estimada: string | null;
  fecha_cosecha_real: string | null;
  etapa: EtapaCultivo;
  ubicacion: string | null;
  responsable: string | null;
  observaciones: string | null;
  estado: EstadoCultivo;
  fecha_creacion: string;
  fecha_modificacion: string;
}

/** Campos que acepta el cliente al crear un cultivo. */
export interface DatosCultivo {
  nombre: string;
  tipo?: string;
  area?: number;
  fecha_siembra: string;
  fecha_cosecha_estimada?: string;
  ubicacion?: string;
  observaciones?: string;
}

/** Tipos de actividad agrícola. */
export type TipoActividad =
  | 'PREPARACION'
  | 'SIEMBRA'
  | 'RIEGO'
  | 'FERTILIZACION'
  | 'CONTROL_PLAGAS'
  | 'MANTENIMIENTO'
  | 'COSECHA'
  | 'OTRA';

export type EstadoActividad = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';

/** Actividad realizada sobre un cultivo. */
export interface ActividadAgricola {
  id_actividad_agricola: number;
  id_cultivo: number;
  fecha: string;
  tipo: TipoActividad;
  descripcion: string | null;
  estado: EstadoActividad;
  responsable: string | null;
  observaciones: string | null;
}

/** Filtros del listado de cultivos. */
export interface FiltrosCultivo {
  etapa?: EtapaCultivo;
  estado?: EstadoCultivo;
  texto?: string;
}
