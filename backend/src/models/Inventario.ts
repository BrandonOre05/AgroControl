// ============================================================
// models/Inventario.ts
// Tipos del módulo de inventario.
// ============================================================

export type CategoriaProducto =
  | 'ALIMENTO'
  | 'MEDICAMENTO'
  | 'VACUNA'
  | 'FERTILIZANTE'
  | 'SEMILLA'
  | 'HERRAMIENTA'
  | 'OTRO';

export type EstadoProducto = 'DISPONIBLE' | 'BAJO' | 'AGOTADO' | 'VENCIDO';

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface Producto {
  id_producto: number;
  id_finca: number;
  nombre: string;
  categoria: CategoriaProducto;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  fecha_vencimiento: string | null;
  estado: EstadoProducto;
  observaciones: string | null;
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  nombre_producto: string | null;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: string;
  motivo: string | null;
  responsable: string | null;
  observaciones: string | null;
}

export interface DatosProducto {
  nombre: string;
  categoria: CategoriaProducto;
  unidad: string;
  stock_actual: number;
  stock_minimo?: number;
  /** Permite null para quitar la fecha de vencimiento. */
  fecha_vencimiento?: string | null;
  observaciones?: string;
}

export interface FiltrosProducto {
  categoria?: CategoriaProducto;
  estado?: EstadoProducto;
  texto?: string;
}
