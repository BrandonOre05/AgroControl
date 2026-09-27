// ============================================================
// repositories/ActividadRepository.ts
// Consultas de la tabla Actividad (tareas del personal).
// ============================================================

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import { Actividad, DatosActividad, EstadoTarea, FiltrosActividad } from '../models/Actividad';

type ActividadRow = Actividad & RowDataPacket;

const COLUMNAS_PERMITIDAS = [
  'nombre',
  'descripcion',
  'tipo',
  'fecha',
  'hora',
  'responsable',
  'observaciones',
] as const;

export class ActividadRepository {
  /** Lista actividades con filtros. */
  async findAll(idFinca: number, filtros: FiltrosActividad = {}): Promise<ActividadRow[]> {
    const condiciones: string[] = ['a.id_finca = ?'];
    const valores: unknown[] = [idFinca];

    if (filtros.estado) {
      condiciones.push('a.estado = ?');
      valores.push(filtros.estado);
    }

    if (filtros.tipo) {
      condiciones.push('a.tipo = ?');
      valores.push(filtros.tipo);
    }

    if (filtros.responsable) {
      condiciones.push('a.responsable = ?');
      valores.push(filtros.responsable);
    }

    const [filas] = await pool.query<ActividadRow[]>(
      `SELECT a.*, u.nombre AS responsable
       FROM Actividad a
       LEFT JOIN Usuario u ON u.id_usuario = a.responsable
       WHERE ${condiciones.join(' AND ')}
       ORDER BY a.fecha DESC, a.hora DESC`,
      valores
    );

    return filas;
  }

  /** Busca una actividad por id. */
  async findById(id: number): Promise<ActividadRow | null> {
    const [filas] = await pool.query<ActividadRow[]>(
      `SELECT a.*, u.nombre AS responsable
       FROM Actividad a
       LEFT JOIN Usuario u ON u.id_usuario = a.responsable
       WHERE a.id_actividad = ?`,
      [id]
    );

    return filas[0] ?? null;
  }

  /** Inserta una actividad. */
  async create(datos: DatosActividad, idFinca: number): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Actividad (id_finca, nombre, descripcion, tipo, fecha, hora, responsable, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idFinca,
        datos.nombre,
        datos.descripcion ?? null,
        datos.tipo,
        datos.fecha,
        datos.hora ?? null,
        datos.responsable ?? null,
        datos.observaciones ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Actualiza los datos de una actividad. */
  async update(id: number, datos: Partial<DatosActividad>): Promise<void> {
    const campos = Object.keys(datos).filter((campo) =>
      (COLUMNAS_PERMITIDAS as readonly string[]).includes(campo)
    );

    if (campos.length === 0) return;

    const setClause = campos.map((campo) => `${campo} = ?`).join(', ');
    const valores = campos.map((campo) => (datos as Record<string, unknown>)[campo]);

    await pool.query(`UPDATE Actividad SET ${setClause} WHERE id_actividad = ?`, [...valores, id]);
  }

  /** Cambia el estado (pendiente, en proceso, completada, cancelada). */
  async cambiarEstado(id: number, estado: EstadoTarea): Promise<void> {
    await pool.query('UPDATE Actividad SET estado = ? WHERE id_actividad = ?', [estado, id]);
  }

  /** Cuenta actividades por estado. */
  async contarPorEstado(idFinca: number): Promise<{ estado: string; cantidad: number }[]> {
    const [filas] = await pool.query<RowDataPacket[]>(
      'SELECT estado, COUNT(*) AS cantidad FROM Actividad WHERE id_finca = ? GROUP BY estado',
      [idFinca]
    );

    return filas.map((f) => ({ estado: f.estado, cantidad: Number(f.cantidad) }));
  }
}

export const actividadRepository = new ActividadRepository();
