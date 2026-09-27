// ============================================================
// repositories/AlertaRepository.ts
// Consultas SQL de la tabla Alerta.
// ============================================================

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import { Alerta, AlertaCandidata, FiltrosAlerta, Severidad, TipoAlerta } from '../models/Alerta';

type AlertaRow = Alerta & RowDataPacket;

export class AlertaRepository {
  /** Lista alertas de una finca con filtros opcionales. */
  async findAll(idFinca: number, filtros: FiltrosAlerta = {}): Promise<AlertaRow[]> {
    const condiciones: string[] = ['a.id_finca = ?'];
    const valores: unknown[] = [idFinca];

    if (filtros.estado) {
      condiciones.push('a.estado = ?');
      valores.push(filtros.estado);
    }

    if (filtros.severidad) {
      condiciones.push('a.severidad = ?');
      valores.push(filtros.severidad);
    }

    if (filtros.tipo) {
      condiciones.push('a.tipo = ?');
      valores.push(filtros.tipo);
    }

    const [filas] = await pool.query<AlertaRow[]>(
      `SELECT a.* FROM Alerta a
       WHERE ${condiciones.join(' AND ')}
       ORDER BY
         CASE a.severidad WHEN 'CRITICA' THEN 1 WHEN 'ADVERTENCIA' THEN 2 ELSE 3 END,
         a.fecha_deteccion DESC`,
      valores
    );

    return filas;
  }

  /** Alertas activas de una finca. */
  async activas(idFinca: number): Promise<AlertaRow[]> {
    const [filas] = await pool.query<AlertaRow[]>(
      "SELECT * FROM Alerta WHERE id_finca = ? AND estado = 'ACTIVA'",
      [idFinca]
    );

    return filas;
  }

  /** Busca una alerta por id. */
  async findById(id: number): Promise<AlertaRow | null> {
    const [filas] = await pool.query<AlertaRow[]>('SELECT * FROM Alerta WHERE id_alerta = ?', [id]);

    return filas[0] ?? null;
  }

  /** Inserta una alerta nueva. */
  async create(idFinca: number, candidata: AlertaCandidata): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Alerta (id_finca, tipo, severidad, mensaje, id_animal, id_producto, id_cultivo, id_actividad)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idFinca,
        candidata.tipo,
        candidata.severidad,
        candidata.mensaje,
        candidata.id_animal ?? null,
        candidata.id_producto ?? null,
        candidata.id_cultivo ?? null,
        candidata.id_actividad ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Marca una alerta como resuelta o ignorada. */
  async cambiarEstado(
    id: number,
    estado: 'RESUELTA' | 'IGNORADA',
    idUsuario?: number
  ): Promise<void> {
    await pool.query(
      'UPDATE Alerta SET estado = ?, fecha_resolucion = NOW(), resuelta_por = ? WHERE id_alerta = ?',
      [estado, idUsuario ?? null, id]
    );
  }

  /** Resuelve automáticamente las alertas que ya不复en (sin usuario). */
  async resolverAutomaticamente(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;

    // Los ? se generan solos: (?, ?, ?, ...)
    const marcas = ids.map(() => '?').join(', ');

    const [resultado] = await pool.query<ResultSetHeader>(
      `UPDATE Alerta
       SET estado = 'RESUELTA', fecha_resolucion = NOW(), resuelta_por = NULL
       WHERE id_alerta IN (${marcas})`,
      ids
    );

    return resultado.affectedRows;
  }

  /** Actualiza la severidad de una alerta (si cambió el nivel del problema). */
  async actualizarSeveridad(id: number, severidad: Severidad): Promise<void> {
    await pool.query('UPDATE Alerta SET severidad = ? WHERE id_alerta = ?', [severidad, id]);
  }

  /** Cuenta alertas por severidad. */
  async contarPorSeveridad(idFinca: number): Promise<{ severidad: Severidad; cantidad: number }[]> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT severidad, COUNT(*) AS cantidad
       FROM Alerta
       WHERE id_finca = ? AND estado = 'ACTIVA'
       GROUP BY severidad`,
      [idFinca]
    );

    return filas.map((fila) => ({
      severidad: fila.severidad as Severidad,
      cantidad: Number(fila.cantidad),
    }));
  }

  /**
   * Datos para detectar Vaccines vencidas o próximas a vencer.
   * Trae solo la más próxima/urgente de cada animal.
   */
  async vacunasPorVencer(idFinca: number, dias: number) {
    const [filas] = await pool.query<
      (RowDataPacket & {
        id_animal: number;
        codigo: string;
        nombre_animal: string | null;
        nombre_vacuna: string;
        fecha: string;
        dias: number;
      })[]
    >(
      `SELECT v.id_animal, a.codigo, a.nombre AS nombre_animal, v.nombre AS nombre_vacuna,
              v.proxima_fecha AS fecha,
              DATEDIFF(v.proxima_fecha, CURDATE()) AS dias
       FROM Vacuna v
       JOIN Animal a ON a.id_animal = v.id_animal
       WHERE a.id_finca = ? AND a.estado_animal = 'ACTIVO'
         AND v.proxima_fecha IS NOT NULL
         AND v.proxima_fecha <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
         AND v.proxima_fecha = (
           SELECT MIN(v2.proxima_fecha) FROM Vacuna v2
           WHERE v2.id_animal = v.id_animal AND v2.proxima_fecha IS NOT NULL
         )
       ORDER BY v.proxima_fecha ASC`,
      [idFinca, dias]
    );

    return filas;
  }

  /** Controles vencidos o próximos a vencer (uno por animal). */
  async controlesPorVencer(idFinca: number, dias: number) {
    const [filas] = await pool.query<
      (RowDataPacket & {
        id_animal: number;
        codigo: string;
        nombre_animal: string | null;
        tipo: string;
        fecha: string;
        dias: number;
      })[]
    >(
      `SELECT c.id_animal, a.codigo, a.nombre AS nombre_animal, c.tipo,
              c.proxima_fecha AS fecha,
              DATEDIFF(c.proxima_fecha, CURDATE()) AS dias
       FROM ControlAnimal c
       JOIN Animal a ON a.id_animal = c.id_animal
       WHERE a.id_finca = ? AND a.estado_animal = 'ACTIVO'
         AND c.proxima_fecha IS NOT NULL
         AND c.proxima_fecha <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
         AND c.proxima_fecha = (
           SELECT MIN(c2.proxima_fecha) FROM ControlAnimal c2
           WHERE c2.id_animal = c.id_animal AND c2.proxima_fecha IS NOT NULL
         )
       ORDER BY c.proxima_fecha ASC`,
      [idFinca, dias]
    );

    return filas;
  }

  /** Tratamientos cuya fecha de fin ya pasó o está por llegar. */
  async tratamientosPorVencer(idFinca: number, dias: number) {
    const [filas] = await pool.query<
      (RowDataPacket & {
        id_animal: number;
        codigo: string;
        nombre_animal: string | null;
        nombre_tratamiento: string;
        fecha: string;
        dias: number;
      })[]
    >(
      `SELECT t.id_animal, a.codigo, a.nombre AS nombre_animal,
              t.nombre AS nombre_tratamiento,
              t.fecha_fin AS fecha,
              DATEDIFF(t.fecha_fin, CURDATE()) AS dias
       FROM Tratamiento t
       JOIN Animal a ON a.id_animal = t.id_animal
       WHERE a.id_finca = ? AND a.estado_animal = 'ACTIVO'
         AND t.fecha_fin IS NOT NULL
         AND t.fecha_fin <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
         AND t.fecha_fin = (
           SELECT MIN(t2.fecha_fin) FROM Tratamiento t2
           WHERE t2.id_animal = t.id_animal AND t2.fecha_fin IS NOT NULL
         )
       ORDER BY t.fecha_fin ASC`,
      [idFinca, dias]
    );

    return filas;
  }

  /** Productos con stock igual o por debajo del mínimo. */
  async productosStockBajo(idFinca: number) {
    const [filas] = await pool.query<
      (RowDataPacket & {
        id_producto: number;
        nombre: string;
        stock_actual: number;
        stock_minimo: number;
        unidad: string;
      })[]
    >(
      `SELECT id_producto, nombre, stock_actual, stock_minimo, unidad
       FROM Producto
       WHERE id_finca = ? AND stock_actual <= stock_minimo
       ORDER BY stock_actual ASC`,
      [idFinca]
    );

    return filas;
  }

  /** Actividades pendientes cuya fecha ya llegó. */
  async actividadesPendientes(idFinca: number) {
    const [filas] = await pool.query<
      (RowDataPacket & { id_actividad: number; nombre: string; fecha: string })[]
    >(
      `SELECT id_actividad, nombre, fecha
       FROM Actividad
       WHERE id_finca = ? AND estado = 'PENDIENTE' AND fecha <= CURDATE()
       ORDER BY fecha ASC`,
      [idFinca]
    );

    return filas;
  }

  /** Cultivos con cosecha estimada en los próximos días. */
  async cosechasProximas(idFinca: number, dias: number) {
    const [filas] = await pool.query<
      (RowDataPacket & { id_cultivo: number; nombre: string; fecha: string; dias: number })[]
    >(
      `SELECT id_cultivo, nombre, fecha_cosecha_estimada AS fecha,
              DATEDIFF(fecha_cosecha_estimada, CURDATE()) AS dias
       FROM Cultivo
       WHERE id_finca = ? AND estado = 'ACTIVO'
         AND fecha_cosecha_estimada IS NOT NULL
         AND fecha_cosecha_estimada BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY fecha_cosecha_estimada ASC`,
      [idFinca, dias]
    );

    return filas;
  }

  /** Animales que, según el Índice, están en observación o atención. */
  async animalesConAlerta(idFinca: number) {
    const [filas] = await pool.query<
      (RowDataPacket & {
        id_animal: number;
        codigo: string;
        nombre: string | null;
        estado_indice: 'OBSERVACION' | 'ATENCION';
      })[]
    >(
      `SELECT id_animal, codigo, nombre, estado_indice
       FROM Animal
       WHERE id_finca = ? AND estado_animal = 'ACTIVO'
         AND estado_indice IN ('OBSERVACION', 'ATENCION')
       ORDER BY estado_indice ASC, codigo ASC`,
      [idFinca]
    );

    return filas;
  }
}

export const alertaRepository = new AlertaRepository();
