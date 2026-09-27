// ============================================================
// models/Produccion.ts
// Tipos de producción ganadera y agrícola.
//
// Son dos tablas distintas (no una con id_animal/id_cultivo) para no
// usar relaciones polimórficas, que son un error de diseño en SQL.
// ============================================================

export type TipoProduccion = 'LECHE' | 'PESO' | 'HUEVO' | 'CARNE' | 'OTRO';

export interface ProduccionGanadera {
  id_produccion_ganadera: number;
  id_animal: number;
  codigo_animal: string | null;
  tipo: TipoProduccion;
  cantidad: number;
  unidad: string;
  fecha: string;
  responsable: string | null;
  observaciones: string | null;
}

export interface ProduccionAgricola {
  id_produccion_agricola: number;
  id_cultivo: number;
  nombre_cultivo: string | null;
  producto: string;
  cantidad: number;
  unidad: string;
  fecha_cosecha: string;
  responsable: string | null;
  observaciones: string | null;
}

export interface FiltrosProduccion {
  tipo?: TipoProduccion;
  id_animal?: number;
  dias?: number;
}
