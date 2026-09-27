// ============================================================
// core/models.ts
// Interfaces (tipos) de los datos que llegan de la API.
// Deben coincidir con los "models" del backend.
// ============================================================

// --- Usuarios y sesión ---

export type Rol = 'ADMIN' | 'ENCARGADO' | 'TRABAJADOR';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: EstadoUsuario;
  telefono: string | null;
  ultimo_login: string | null;
  fecha_creacion: string;
}

export interface RespuestaLogin {
  token: string;
  rol: Rol;
  usuario: { id_usuario: number; nombre: string; correo: string };
}

/** Respuesta de GET /api/auth/permisos */
export interface RespuestaPermisos {
  rol: Rol;
  permisos: Record<string, Record<string, boolean>>;
}

// --- Animales ---

export type Sexo = 'MACHO' | 'HEMBRA';
export type EstadoAnimal = 'ACTIVO' | 'VENDIDO' | 'FALECIDO' | 'TRANSFERIDO';
export type EstadoIndice = 'OPTIMO' | 'OBSERVACION' | 'ATENCION';

export interface Animal {
  id_animal: number;
  id_finca: number;
  codigo: string;
  nombre: string | null;
  especie: string;
  raza: string | null;
  sexo: Sexo;
  fecha_nacimiento: string | null;
  fecha_ingreso: string;
  ubicacion_finca: string | null;
  estado_animal: EstadoAnimal;
  observaciones: string | null;
  estado_indice: EstadoIndice;
  estado_indice_fecha: string | null;
  ultimo_peso: number | null;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface EventoHistorial {
  fecha_evento: string;
  tipo_evento: string;
  id_evento: number;
  titulo: string;
  detalle: string | null;
  responsable: string | null;
}

export interface ProximoEvento {
  tipo: 'VACUNA' | 'TRATAMIENTO' | 'CONTROL';
  titulo: string;
  fecha: string;
  dias_restantes: number;
}

// --- Alertas ---

export type Severidad = 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA';

export interface Alerta {
  id_alerta: number;
  tipo: string;
  severidad: Severidad;
  mensaje: string;
  id_animal: number | null;
  id_producto: number | null;
  id_cultivo: number | null;
  id_actividad: number | null;
  fecha_deteccion: string;
  estado: 'ACTIVA' | 'RESUELTA' | 'IGNORADA';
  fecha_resolucion: string | null;
}

// --- Dashboard ---

export interface Conteo {
  etiqueta: string;
  cantidad: number;
}

export interface ResumenDashboard {
  generado_en: string;
  animales: {
    total: number;
    por_indice: { indice: EstadoIndice; cantidad: number }[];
    por_estado: { estado: EstadoAnimal; cantidad: number }[];
    por_especie: Conteo[];
  };
  cultivos: {
    total_activos: number;
    por_etapa: Conteo[];
    cosechas_proximas: number;
  };
  produccion: {
    leche_ultimos_30_dias: number;
    cosechas_ultimos_30_dias: number;
  };
  inventario: {
    total_productos: number;
    stock_bajo: number;
    agotados: number;
  };
  actividades_pendientes: number;
  controles_proximos_30_dias: number;
  alertas: {
    total: number;
    por_severidad: Conteo[];
  };
}

// --- Cultivos ---

export type EtapaCultivo =
  'PREPARACION' | 'SIEMBRA' | 'CRECIMIENTO' | 'MANTENIMIENTO' | 'COSECHA' | 'FINALIZADA';

export type EstadoCultivo = 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';

export interface Cultivo {
  id_cultivo: number;
  id_finca: number;
  nombre: string;
  tipo: string | null;
  area: number | null;
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

export type TipoActividad =
  | 'PREPARACION'
  | 'SIEMBRA'
  | 'RIEGO'
  | 'FERTILIZACION'
  | 'CONTROL_PLAGAS'
  | 'MANTENIMIENTO'
  | 'COSECHA'
  | 'OTRA';

export interface ActividadAgricola {
  id_actividad_agricola: number;
  id_cultivo: number;
  fecha: string;
  tipo: TipoActividad;
  descripcion: string | null;
  estado: string;
  responsable: string | null;
  observaciones: string | null;
}

// --- Inventario ---

export type CategoriaProducto =
  'ALIMENTO' | 'MEDICAMENTO' | 'VACUNA' | 'FERTILIZANTE' | 'SEMILLA' | 'HERRAMIENTA' | 'OTRO';

export type EstadoProducto = 'DISPONIBLE' | 'BAJO' | 'AGOTADO' | 'VENCIDO';

export interface Producto {
  id_producto: number;
  nombre: string;
  categoria: CategoriaProducto;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  fecha_vencimiento: string | null;
  estado: EstadoProducto;
  observaciones: string | null;
}

export interface Movimiento {
  id_movimiento: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  fecha: string;
  motivo: string | null;
  responsable: string | null;
}

export interface ResumenInventario {
  total_productos: number;
  stock_bajo: number;
  agotados: number;
  vencidos: number;
  por_categoria: { etiqueta: string; cantidad: number }[];
}

// --- Producción ---

export interface ResumenProduccion {
  dias: number;
  totales: { tipo: string; total: number; unidad: string }[];
  por_dia: { fecha: string; total: number }[];
  top_animales: { codigo: string; nombre: string | null; total: number; unidad: string }[];
  cosecha_agricola: number;
}

// --- Actividades (tareas del personal) ---

export type EstadoTarea = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';

export interface Tarea {
  id_actividad: number;
  nombre: string;
  descripcion: string | null;
  tipo: 'AGRICOLA' | 'GANADERA' | 'ADMINISTRATIVA' | 'MANTENIMIENTO' | 'OTRA';
  fecha: string;
  hora: string | null;
  estado: EstadoTarea;
  responsable: string | null;
  observaciones: string | null;
}

// --- Reportes ---

export interface Reporte {
  tipo: string;
  titulo: string;
  columnas: string[];
  filas: Record<string, unknown>[];
  generado_en: string;
}

// --- Alimentación ---

/**
 * Ficha completa de un animal.
 * La arma el servicio encadenando tres peticiones con switchMap,
 * así que el componente recibe todo junto en un solo objeto.
 */
export interface FichaAnimal {
  animal: Animal;
  historial: EventoHistorial[];
  proximos: ProximoEvento[];
}

export interface Alimentacion {
  id_alimentacion: number;
  id_animal: number | null;
  codigo_animal: string | null;
  grupo: string | null;
  tipo_alimento: string;
  cantidad: number;
  unidad: string;
  fecha: string;
  hora: string | null;
  responsable: string | null;
  observaciones: string | null;
}
