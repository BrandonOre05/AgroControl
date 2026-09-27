// ============================================================
// models/Finca.ts
// Tipos de la entidad Finca (los animales, cultivos e inventario
// pertenecen a una finca).
// ============================================================

export type TipoProduccion = 'AGRICOLA' | 'GANADERA' | 'MIXTA';
export type EstadoFinca = 'ACTIVA' | 'INACTIVA';

/** Datos que guarda la tabla Finca. */
export interface Finca {
  id_finca: number;
  nombre: string;
  ubicacion: string | null;
  extension: number | null; // Hectáreas
  descripcion: string | null;
  tipo_produccion: TipoProduccion;
  contacto_telefono: string | null;
  contacto_correo: string | null;
  estado: EstadoFinca;
  fecha_creacion: Date;
  fecha_modificacion: Date;
}

/** Campos que acepta el cliente al crear o actualizar una finca. */
export interface DatosFinca {
  nombre: string;
  ubicacion?: string;
  extension?: number;
  descripcion?: string;
  tipo_produccion?: TipoProduccion;
  contacto_telefono?: string;
  contacto_correo?: string;
}
