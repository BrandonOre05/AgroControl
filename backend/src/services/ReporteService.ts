// ============================================================
// services/ReporteService.ts
// Genera reportes en dos formatos:
//   - json: los datos crudos (el frontend los muestra o los grafica)
//   - csv:  archivo de Excel que se descarga
//
// Para PDF no usamos librerías: el frontend genera una vista
// imprimible y el usuario guarda el PDF desde el navegador
// (Ctrl + P -> Guardar como PDF). Es la opción más simple y fiable.
//
// IMPORTANTE: cada columna declara su TÍTULO (lo que ve el usuario)
// y su CLAVE (el alias exacto de la consulta SQL). Antes se intentaba
// adivinar la clave a partir del título y eso dejaba columnas vacías.
// ============================================================

import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import { AppError } from '../utils/AppError';
import { fincaService } from './FincaService';

export const TIPOS_REPORTE = [
  'produccion',
  'animales',
  'actividades',
  'cultivos',
  'inventario',
] as const;

export type TipoReporte = (typeof TIPOS_REPORTE)[number];

/** Una columna de reporte: título visible + clave real del SQL. */
interface Columna {
  titulo: string;
  clave: string;
}

interface DefinicionReporte {
  titulo: string;
  columnas: Columna[];
  sql: string;
}

const REPORTES: Record<TipoReporte, DefinicionReporte> = {
  produccion: {
    titulo: 'Reporte de producción',
    columnas: [
      { titulo: 'Fecha', clave: 'fecha' },
      { titulo: 'Animal', clave: 'animal' },
      { titulo: 'Tipo', clave: 'tipo' },
      { titulo: 'Cantidad', clave: 'cantidad' },
      { titulo: 'Unidad', clave: 'unidad' },
      { titulo: 'Responsable', clave: 'responsable' },
    ],
    sql: `
      SELECT DATE_FORMAT(p.fecha, '%d/%m/%Y') AS fecha, a.codigo AS animal, p.tipo,
             p.cantidad, p.unidad AS unidad,
             COALESCE(u.nombre, '-') AS responsable
      FROM ProduccionGanadera p
      JOIN Animal a ON a.id_animal = p.id_animal
      LEFT JOIN Usuario u ON u.id_usuario = p.responsable
      WHERE a.id_finca = ?
      ORDER BY p.fecha DESC, p.id_produccion_ganadera DESC`,
  },
  animales: {
    titulo: 'Reporte de animales',
    columnas: [
      { titulo: 'Código', clave: 'codigo' },
      { titulo: 'Nombre', clave: 'nombre' },
      { titulo: 'Especie', clave: 'especie' },
      { titulo: 'Raza', clave: 'raza' },
      { titulo: 'Sexo', clave: 'sexo' },
      { titulo: 'Estado', clave: 'estado' },
      { titulo: 'Índice', clave: 'indice' },
      { titulo: 'Último peso (kg)', clave: 'ultimo_peso' },
    ],
    sql: `
      SELECT a.codigo, COALESCE(a.nombre, '-') AS nombre, a.especie,
             COALESCE(a.raza, '-') AS raza, a.sexo,
             a.estado_animal AS estado,
             a.estado_indice AS indice,
             COALESCE((SELECT p.peso FROM Pesaje p WHERE p.id_animal = a.id_animal
                       ORDER BY p.fecha DESC LIMIT 1), '-') AS ultimo_peso
      FROM Animal a
      WHERE a.id_finca = ?
      ORDER BY a.codigo`,
  },
  actividades: {
    titulo: 'Reporte de actividades',
    columnas: [
      { titulo: 'Fecha', clave: 'fecha' },
      { titulo: 'Actividad', clave: 'actividad' },
      { titulo: 'Tipo', clave: 'tipo' },
      { titulo: 'Estado', clave: 'estado' },
      { titulo: 'Responsable', clave: 'responsable' },
    ],
    sql: `
      SELECT DATE_FORMAT(a.fecha, '%d/%m/%Y') AS fecha, a.nombre AS actividad, a.tipo, a.estado,
             COALESCE(u.nombre, '-') AS responsable
      FROM Actividad a
      LEFT JOIN Usuario u ON u.id_usuario = a.responsable
      WHERE a.id_finca = ?
      ORDER BY a.fecha DESC, a.id_actividad DESC`,
  },
  cultivos: {
    titulo: 'Reporte de cultivos',
    columnas: [
      { titulo: 'Nombre', clave: 'nombre' },
      { titulo: 'Tipo', clave: 'tipo' },
      { titulo: 'Área (ha)', clave: 'area' },
      { titulo: 'Etapa', clave: 'etapa' },
      { titulo: 'Estado', clave: 'estado' },
      { titulo: 'Siembra', clave: 'siembra' },
      { titulo: 'Cosecha estimada', clave: 'cosecha' },
    ],
    sql: `
      SELECT nombre, COALESCE(tipo, '-') AS tipo, COALESCE(area, '-') AS area,
             etapa, estado,
             DATE_FORMAT(fecha_siembra, '%d/%m/%Y') AS siembra,
             COALESCE(DATE_FORMAT(fecha_cosecha_estimada, '%d/%m/%Y'), '-') AS cosecha
      FROM Cultivo
      WHERE id_finca = ?
      ORDER BY fecha_siembra DESC`,
  },
  inventario: {
    titulo: 'Reporte de inventario',
    columnas: [
      { titulo: 'Producto', clave: 'nombre' },
      { titulo: 'Categoría', clave: 'categoria' },
      { titulo: 'Stock actual', clave: 'stock_actual' },
      { titulo: 'Stock mínimo', clave: 'stock_minimo' },
      { titulo: 'Unidad', clave: 'unidad' },
      { titulo: 'Estado', clave: 'estado' },
    ],
    sql: `
      SELECT nombre, categoria, stock_actual, stock_minimo, unidad, estado
      FROM Producto
      WHERE id_finca = ?
      ORDER BY nombre`,
  },
};

export class ReporteService {
  /** Ejecuta la consulta del reporte y devuelve los datos. */
  async generar(tipo: string) {
    const reporte = REPORTES[tipo as TipoReporte];

    if (!reporte) {
      throw new AppError(`El reporte "${tipo}" no existe`, 404);
    }

    const idFinca = await fincaService.obtenerId();

    const [filas] = await pool.query<RowDataPacket[]>(reporte.sql, [idFinca]);

    return {
      tipo: tipo as TipoReporte,
      titulo: reporte.titulo,
      columnas: reporte.columnas.map((c) => c.titulo),
      filas: filas as Record<string, unknown>[],
      generado_en: new Date().toISOString(),
    };
  }

  /**
   * Convierte el reporte en texto CSV.
   * Se separan los valores con punto y coma porque así Excel en
   * español los abre directamente como columnas.
   */
  async generarCsv(tipo: string): Promise<{ nombreArchivo: string; contenido: string }> {
    const reporte = REPORTES[tipo as TipoReporte];

    if (!reporte) {
      throw new AppError(`El reporte "${tipo}" no existe`, 404);
    }

    const datos = await this.generar(tipo);

    const lineas: string[] = [
      this.escapar(datos.titulo),
      this.escapar(`Generado: ${new Date().toLocaleString('es-MX')}`),
      '',
      // La cabecera se arma columna por columna (igual que las filas)
      // para que no acabe toda entrecomillada por los ";"
      reporte.columnas.map((c) => this.escapar(c.titulo)).join(';'),
    ];

    for (const fila of datos.filas) {
      // Usamos la CLAVE declarada, nunca el título traducido
      const valores = reporte.columnas.map((columna) => this.escapar(fila[columna.clave] ?? ''));

      lineas.push(valores.join(';'));
    }

    return {
      nombreArchivo: `${datos.tipo}-${new Date().toISOString().slice(0, 10)}.csv`,
      // BOM para que Excel respete los acentos
      contenido: '\uFEFF' + lineas.join('\r\n'),
    };
  }

  /** Escapa un valor: si trae ; o comillas, lo entrecomilla. */
  private escapar(valor: unknown): string {
    const texto = String(valor ?? '');

    if (texto.includes(';') || texto.includes('"')) {
      return `"${texto.replace(/"/g, '""')}"`;
    }

    return texto;
  }
}

export const reporteService = new ReporteService();
