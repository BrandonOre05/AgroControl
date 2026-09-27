// ============================================================
// repositories/AlimentacionRepository.ts
// Consultas de la tabla Alimentacion.
//
// REGLA IMPORTANTE: si la alimentación usa un producto del
// inventario, se guarda el registro Y se descuenta el stock en la
// MISMA transacción. Así nunca queda alimento registrado sin haber
// descontado el insumo (o al revés).
// ============================================================

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import { Alimentacion, DatosAlimentacion, FiltrosAlimentacion } from '../models/Alimentacion';
import { aplicarMovimiento } from './InventarioRepository';

type AlimentacionRow = Alimentacion & RowDataPacket;

export class AlimentacionRepository {
  /**
   * Registra una alimentación y descuenta el insumo del inventario
   * (si se indicó producto). Devuelve el id y el stock restante.
   */
  async registrar(
    datos: DatosAlimentacion,
    responsable?: number
  ): Promise<{ id_alimentacion: number; stock_restante: number | null }> {
    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      // 1) Guardamos el registro de alimentación
      const [resultado] = await conexion.query<ResultSetHeader>(
        `INSERT INTO Alimentacion (id_animal, grupo, id_producto, tipo_alimento, cantidad,
                                   unidad, fecha, hora, responsable, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          datos.id_animal ?? null,
          datos.grupo ?? null,
          datos.id_producto ?? null,
          datos.tipo_alimento,
          datos.cantidad,
          datos.unidad,
          datos.fecha,
          datos.hora ?? null,
          responsable ?? null,
          datos.observaciones ?? null,
        ]
      );

      // 2) Si es un producto del inventario, lo descontamos
      let stockRestante: number | null = null;

      if (datos.id_producto) {
        stockRestante = await aplicarMovimiento(
          conexion,
          datos.id_producto,
          'SALIDA',
          datos.cantidad,
          `Alimentación: ${datos.tipo_alimento}`,
          responsable,
          datos.observaciones
        );
      }

      await conexion.commit();

      return { id_alimentacion: resultado.insertId, stock_restante: stockRestante };
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  }

  /** Lista alimentaciones con filtros opcionales. */
  async findAll(filtros: FiltrosAlimentacion = {}): Promise<AlimentacionRow[]> {
    const condiciones: string[] = [];
    const valores: unknown[] = [];

    if (filtros.id_animal) {
      condiciones.push('al.id_animal = ?');
      valores.push(filtros.id_animal);
    }

    if (filtros.dias) {
      condiciones.push('al.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)');
      valores.push(filtros.dias);
    }

    // El límite viene ya validado como número (1..200), por eso es
    // seguro interpolarlo: NO viene directo del cliente como texto.
    const limite = filtros.limite ?? 50;

    const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const [filas] = await pool.query<AlimentacionRow[]>(
      `SELECT al.*, a.codigo AS codigo_animal, p.nombre AS nombre_producto,
              u.nombre AS responsable
       FROM Alimentacion al
       LEFT JOIN Animal a ON a.id_animal = al.id_animal
       LEFT JOIN Producto p ON p.id_producto = al.id_producto
       LEFT JOIN Usuario u ON u.id_usuario = al.responsable
       ${where}
       ORDER BY al.fecha DESC, al.hora DESC
       LIMIT ${limite}`,
      valores
    );

    return filas;
  }
}

export const alimentacionRepository = new AlimentacionRepository();
