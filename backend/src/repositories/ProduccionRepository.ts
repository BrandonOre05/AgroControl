// ============================================================
// repositories/ProduccionRepository.ts
// Consultas de ProduccionGanadera y ProduccionAgricola.
// ============================================================

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import {
  FiltrosProduccion,
  ProduccionAgricola,
  ProduccionGanadera,
  TipoProduccion,
} from '../models/Produccion';

type GanaderaRow = ProduccionGanadera & RowDataPacket;
type AgricolaRow = ProduccionAgricola & RowDataPacket;

export class ProduccionRepository {
  // ---------- Ganadera ----------

  /** Inserta un registro de producción animal. */
  async createGanadera(
    datos: { id_animal: number; tipo: TipoProduccion; cantidad: number; unidad: string; fecha: string; observaciones?: string },
    responsable?: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO ProduccionGanadera (id_animal, tipo, cantidad, unidad, fecha, responsable, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.id_animal,
        datos.tipo,
        datos.cantidad,
        datos.unidad,
        datos.fecha,
        responsable ?? null,
        datos.observaciones ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Lista producción ganadera con filtros. */
  async findGanadera(idFinca: number, filtros: FiltrosProduccion = {}): Promise<GanaderaRow[]> {
    const condiciones: string[] = ['a.id_finca = ?'];
    const valores: unknown[] = [idFinca];

    if (filtros.tipo) {
      condiciones.push('p.tipo = ?');
      valores.push(filtros.tipo);
    }

    if (filtros.id_animal) {
      condiciones.push('p.id_animal = ?');
      valores.push(filtros.id_animal);
    }

    if (filtros.dias) {
      condiciones.push('p.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)');
      valores.push(filtros.dias);
    }

    const [filas] = await pool.query<GanaderaRow[]>(
      `SELECT p.*, a.codigo AS codigo_animal, u.nombre AS responsable
       FROM ProduccionGanadera p
       JOIN Animal a ON a.id_animal = p.id_animal
       LEFT JOIN Usuario u ON u.id_usuario = p.responsable
       WHERE ${condiciones.join(' AND ')}
       ORDER BY p.fecha DESC, p.id_produccion_ganadera DESC`,
      valores
    );

    return filas;
  }

  /** Totales por tipo de producción (para las tarjetas del panel). */
  async totalesPorTipo(idFinca: number, dias: number) {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT p.tipo, COALESCE(SUM(p.cantidad), 0) AS total, p.unidad
       FROM ProduccionGanadera p
       JOIN Animal a ON a.id_animal = p.id_animal
       WHERE a.id_finca = ? AND p.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY p.tipo, p.unidad`,
      [idFinca, dias]
    );

    return filas.map((f) => ({
      tipo: f.tipo as TipoProduccion,
      total: Number(f.total),
      unidad: f.unidad,
    }));
  }

  /** Producción agrupada por día (para la gráfica de barras). */
  async porDia(idFinca: number, dias: number, tipo: TipoProduccion = 'LECHE') {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT p.fecha, COALESCE(SUM(p.cantidad), 0) AS total
       FROM ProduccionGanadera p
       JOIN Animal a ON a.id_animal = p.id_animal
       WHERE a.id_finca = ? AND p.tipo = ?
         AND p.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY p.fecha
       ORDER BY p.fecha ASC`,
      [idFinca, tipo, dias]
    );

    return filas.map((f) => ({ fecha: String(f.fecha), total: Number(f.total) }));
  }

  /** Top de animales que más producen. */
  async topAnimales(idFinca: number, tipo: TipoProduccion, dias: number, limite = 5) {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT a.codigo, a.nombre, SUM(p.cantidad) AS total, MAX(p.unidad) AS unidad
       FROM ProduccionGanadera p
       JOIN Animal a ON a.id_animal = p.id_animal
       WHERE a.id_finca = ? AND p.tipo = ?
         AND p.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY a.id_animal, a.codigo, a.nombre
       ORDER BY total DESC
       LIMIT ${limite}`,
      [idFinca, tipo, dias]
    );

    return filas.map((f) => ({
      codigo: f.codigo,
      nombre: f.nombre,
      total: Number(f.total),
      unidad: f.unidad,
    }));
  }

  // ---------- Agrícola ----------

  /** Inserta un registro de cosecha. */
  async createAgricola(
    datos: { id_cultivo: number; producto: string; cantidad: number; unidad: string; fecha_cosecha: string; observaciones?: string },
    responsable?: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO ProduccionAgricola (id_cultivo, producto, cantidad, unidad, fecha_cosecha, responsable, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.id_cultivo,
        datos.producto,
        datos.cantidad,
        datos.unidad,
        datos.fecha_cosecha,
        responsable ?? null,
        datos.observaciones ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Lista la producción agrícola. */
  async findAgricola(idFinca: number, dias?: number): Promise<AgricolaRow[]> {
    const condiciones = ['c.id_finca = ?'];
    const valores: unknown[] = [idFinca];

    if (dias) {
      condiciones.push('p.fecha_cosecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)');
      valores.push(dias);
    }

    const [filas] = await pool.query<AgricolaRow[]>(
      `SELECT p.*, c.nombre AS nombre_cultivo, u.nombre AS responsable
       FROM ProduccionAgricola p
       JOIN Cultivo c ON c.id_cultivo = p.id_cultivo
       LEFT JOIN Usuario u ON u.id_usuario = p.responsable
       WHERE ${condiciones.join(' AND ')}
       ORDER BY p.fecha_cosecha DESC, p.id_produccion_agricola DESC`,
      valores
    );

    return filas;
  }

  /** Total de cosecha agrícola en el periodo. */
  async totalAgricola(idFinca: number, dias: number): Promise<number> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(p.cantidad), 0) AS total
       FROM ProduccionAgricola p
       JOIN Cultivo c ON c.id_cultivo = p.id_cultivo
       WHERE c.id_finca = ? AND p.fecha_cosecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [idFinca, dias]
    );

    return Number(filas[0]?.total ?? 0);
  }
}

export const produccionRepository = new ProduccionRepository();
