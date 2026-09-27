// ============================================================
// repositories/DashboardRepository.ts
// Consultas de agregación para el panel de control.
//
// Cada método devuelve un dato pequeño y puntual. Así el service
// solo los junta y el frontend recibe un solo JSON.
// ============================================================

import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';

export class DashboardRepository {
  /** Total de animales activos. */
  async totalAnimales(idFinca: number): Promise<number> {
    const [filas] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM Animal WHERE id_finca = ? AND estado_animal = 'ACTIVO'",
      [idFinca]
    );

    return Number(filas[0]?.total ?? 0);
  }

  /** Animales agrupados por Índice de Estado. */
  async animalesPorIndice(idFinca: number) {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT estado_indice, COUNT(*) AS cantidad
       FROM Animal
       WHERE id_finca = ? AND estado_animal = 'ACTIVO'
       GROUP BY estado_indice`,
      [idFinca]
    );

    return filas.map((f) => ({ indice: f.estado_indice, cantidad: Number(f.cantidad) }));
  }

  /** Animales agrupados por estado (activo, vendido...). */
  async animalesPorEstado(idFinca: number) {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT estado_animal, COUNT(*) AS cantidad
       FROM Animal WHERE id_finca = ?
       GROUP BY estado_animal`,
      [idFinca]
    );

    return filas.map((f) => ({ estado: f.estado_animal, cantidad: Number(f.cantidad) }));
  }

  /** Animales agrupados por especie. */
  async animalesPorEspecie(idFinca: number) {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT especie, COUNT(*) AS cantidad
       FROM Animal
       WHERE id_finca = ? AND estado_animal = 'ACTIVO'
       GROUP BY especie
       ORDER BY cantidad DESC`,
      [idFinca]
    );

    return filas.map((f) => ({ etiqueta: f.especie, cantidad: Number(f.cantidad) }));
  }

  /** Cultivos activos y agrupados por etapa. */
  async cultivos(idFinca: number) {
    const [total] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM Cultivo WHERE id_finca = ? AND estado = 'ACTIVO'",
      [idFinca]
    );

    const [porEtapa] = await pool.query<RowDataPacket[]>(
      `SELECT etapa, COUNT(*) AS cantidad
       FROM Cultivo WHERE id_finca = ? AND estado = 'ACTIVO'
       GROUP BY etapa`,
      [idFinca]
    );

    return {
      total_activos: Number(total[0]?.total ?? 0),
      por_etapa: porEtapa.map((f) => ({ etiqueta: f.etapa, cantidad: Number(f.cantidad) })),
    };
  }

  /** Cultivos con cosecha estimada en los próximos días. */
  async cosechasProximas(idFinca: number, dias: number): Promise<number> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM Cultivo
       WHERE id_finca = ? AND estado = 'ACTIVO'
         AND fecha_cosecha_estimada IS NOT NULL
         AND fecha_cosecha_estimada BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
      [idFinca, dias]
    );

    return Number(filas[0]?.total ?? 0);
  }

  /** Producción de leche de los últimos 30 días. */
  async lecheUltimos30Dias(idFinca: number): Promise<number> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(pg.cantidad), 0) AS total
       FROM ProduccionGanadera pg
       JOIN Animal a ON a.id_animal = pg.id_animal
       WHERE a.id_finca = ? AND pg.tipo = 'LECHE'
         AND pg.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [idFinca]
    );

    return Number(filas[0]?.total ?? 0);
  }

  /** Cosechas agrícolas de los últimos 30 días. */
  async cosechasUltimos30Dias(idFinca: number): Promise<number> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(pa.cantidad), 0) AS total
       FROM ProduccionAgricola pa
       JOIN Cultivo c ON c.id_cultivo = pa.id_cultivo
       WHERE c.id_finca = ? AND pa.fecha_cosecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [idFinca]
    );

    return Number(filas[0]?.total ?? 0);
  }

  /** Resumen del inventario. */
  async inventario(idFinca: number) {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total_productos,
         SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) AS agotados,
         SUM(CASE WHEN stock_actual > 0 AND stock_actual <= stock_minimo THEN 1 ELSE 0 END) AS stock_bajo
       FROM Producto WHERE id_finca = ?`,
      [idFinca]
    );

    const fila = filas[0];

    return {
      total_productos: Number(fila?.total_productos ?? 0),
      agotados: Number(fila?.agotados ?? 0),
      stock_bajo: Number(fila?.stock_bajo ?? 0),
    };
  }

  /** Actividades pendientes. */
  async actividadesPendientes(idFinca: number): Promise<number> {
    const [filas] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM Actividad WHERE id_finca = ? AND estado = 'PENDIENTE'",
      [idFinca]
    );

    return Number(filas[0]?.total ?? 0);
  }

  /** Controles programados para los próximos 30 días. */
  async controlesProximos(idFinca: number, dias: number): Promise<number> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM ControlAnimal c
       JOIN Animal a ON a.id_animal = c.id_animal
       WHERE a.id_finca = ? AND a.estado_animal = 'ACTIVO'
         AND c.proxima_fecha IS NOT NULL
         AND c.proxima_fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
      [idFinca, dias]
    );

    return Number(filas[0]?.total ?? 0);
  }
}

export const dashboardRepository = new DashboardRepository();
