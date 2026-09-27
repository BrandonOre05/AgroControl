// ============================================================
// models/Actividad.ts
// Tipos de las actividades/tareas del personal de la finca.
// (Distinto de ActividadAgricola, que son las labores de un cultivo)
// ============================================================

export type TipoActividadTarea =
  | 'AGRICOLA'
  | 'GANADERA'
  | 'ADMINISTRATIVA'
  | 'MANTENIMIENTO'
  | 'OTRA';

export type EstadoTarea = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';

export interface Actividad {
  id_actividad: number;
  id_finca: number;
  nombre: string;
  descripcion: string | null;
  tipo: TipoActividadTarea;
  fecha: string;
  hora: string | null;
  estado: EstadoTarea;
  responsable: string | null;
  observaciones: string | null;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface DatosActividad {
  nombre: string;
  descripcion?: string;
  tipo: TipoActividadTarea;
  fecha: string;
  hora?: string;
  responsable?: number;
  observaciones?: string;
}

export interface FiltrosActividad {
  estado?: EstadoTarea;
  tipo?: TipoActividadTarea;
  responsable?: number;
}
