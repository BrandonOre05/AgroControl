// ============================================================
// models/Dashboard.ts
// Tipos del resumen que muestra el panel de control.
// ============================================================

import { EstadoIndice, EstadoAnimal } from './Animal';

/** Contador simple: etiqueta + cantidad. */
export interface Conteo {
  etiqueta: string;
  cantidad: number;
}

/** Indicadores de animales. */
export interface ResumenAnimales {
  total: number;
  por_indice: { indice: EstadoIndice; cantidad: number }[];
  por_estado: { estado: EstadoAnimal; cantidad: number }[];
  por_especie: Conteo[];
}

/** Indicadores de cultivos y actividades. */
export interface ResumenCultivos {
  total_activos: number;
  por_etapa: Conteo[];
  cosechas_proximas: number; // En los próximos 15 días
}

/** Indicadores de producción. */
export interface ResumenProduccion {
  leche_ultimos_30_dias: number;
  cosechas_ultimos_30_dias: number;
}

/** Indicadores de inventario. */
export interface ResumenInventario {
  total_productos: number;
  stock_bajo: number;
  agotados: number;
}

/** Respuesta completa del dashboard. */
export interface ResumenDashboard {
  generado_en: string;
  animales: ResumenAnimales;
  cultivos: ResumenCultivos;
  produccion: ResumenProduccion;
  inventario: ResumenInventario;
  actividades_pendientes: number;
  controles_proximos_30_dias: number;
  alertas: {
    total: number;
    por_severidad: Conteo[];
  };
}
