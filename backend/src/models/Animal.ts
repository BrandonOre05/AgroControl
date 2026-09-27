// ============================================================
// models/Animal.ts
// Tipos de la entidad Animal.
// ============================================================

export type Sexo = 'MACHO' | 'HEMBRA';

/** Estado del animal dentro de la finca (borrado lógico). */
export type EstadoAnimal = 'ACTIVO' | 'VENDIDO' | 'FALECIDO' | 'TRANSFERIDO';

/** Resultado del Índice de Estado del Animal. */
export type EstadoIndice = 'OPTIMO' | 'OBSERVACION' | 'ATENCION';

/** Fila de la tabla Animal, incluyendo el último peso y el índice. */
export interface Animal {
  id_animal: number;
  id_finca: number;
  codigo: string;
  nombre: string | null;
  especie: string;
  raza: string | null;
  sexo: Sexo;
  fecha_nacimiento: string | null; // MySQL devuelve las fechas como texto
  fecha_ingreso: string;
  ubicacion_finca: string | null;
  estado_animal: EstadoAnimal;
  observaciones: string | null;
  estado_indice: EstadoIndice;
  estado_indice_fecha: Date | null;
  ultimo_peso: number | null; // Viene calculado desde la tabla de pesajes
  fecha_creacion: Date;
  fecha_modificacion: Date;
}

/** Campos que el cliente envía al registrar un animal. */
export interface DatosAnimal {
  codigo: string;
  nombre?: string;
  especie: string;
  raza?: string;
  sexo: Sexo;
  fecha_nacimiento?: string;
  fecha_ingreso: string;
  ubicacion_finca?: string;
  observaciones?: string;
}

/** Campos que se pueden modificar (el código no se cambia). */
export type DatosActualizacionAnimal = Partial<Omit<DatosAnimal, 'codigo'>>;

/** Filtros opcionales del listado de animales. */
export interface FiltrosAnimal {
  estado_indice?: EstadoIndice;
  estado_animal?: EstadoAnimal;
  especie?: string;
  texto?: string; // Busca en código, nombre o raza
}

/** Evento del historial individual (viene de la vista vw_historial_animal). */
export interface EventoHistorial {
  fecha_evento: string;
  tipo_evento: string;
  id_evento: number;
  titulo: string;
  detalle: string | null;
  responsable: string | null; // Nombre del usuario
}
