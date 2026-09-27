// ============================================================
// repositories/CultivoRepository.ts
// Consultas SQL de la tabla Cultivo y ActividadAgricola.
// ============================================================

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import {
  ActividadAgricola,
  Cultivo,
  DatosCultivo,
  EtapaCultivo,
  FiltrosCultivo,
  TipoActividad,
  EstadoActividad,
} from '../models/Cultivo';

type CultivoRow = Cultivo & RowDataPacket;
type ActividadRow = ActividadAgricola & RowDataPacket;

/** Solo estas columnas se pueden modificar con un UPDATE. */
const COLUMNAS_PERMITIDAS = [
  'nombre',
  'tipo',
  'area',
  'fecha_siembra',
  'fecha_cosecha_estimada',
  'ubicacion',
  'observaciones',
] as const;

export class CultivoRepository {
  /** Lista los cultivos de la finca con filtros opcionales. */
  async findAll(idFinca: number, filtros: FiltrosCultivo = {}): Promise<CultivoRow[]> {
    const condiciones: string[] = ['c.id_finca = ?'];
    const valores: unknown[] = [idFinca];

    if (filtros.etapa) {
      condiciones.push('c.etapa = ?');
      valores.push(filtros.etapa);
    }

    if (filtros.estado) {
      condiciones.push('c.estado = ?');
      valores.push(filtros.estado);
    }

    if (filtros.texto) {
      condiciones.push('(c.nombre LIKE ? OR c.tipo LIKE ?)');
      const patron = `%${filtros.texto}%`;
      valores.push(patron, patron);
    }

    const [filas] = await pool.query<CultivoRow[]>(
      `SELECT c.*, u.nombre AS responsable
       FROM Cultivo c
       LEFT JOIN Usuario u ON u.id_usuario = c.responsable
       WHERE ${condiciones.join(' AND ')}
       ORDER BY c.fecha_siembra DESC`,
      valores
    );

    return filas;
  }

  /** Busca un cultivo por id. */
  async findById(id: number): Promise<CultivoRow | null> {
    const [filas] = await pool.query<CultivoRow[]>(
      `SELECT c.*, u.nombre AS responsable
       FROM Cultivo c
       LEFT JOIN Usuario u ON u.id_usuario = c.responsable
       WHERE c.id_cultivo = ? LIMIT 1`,
      [id]
    );

    return filas[0] ?? null;
  }

  /** Inserta un cultivo y devuelve su id. */
  async create(
    datos: DatosCultivo,
    idFinca: number,
    responsable?: number,
    creadoPor?: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Cultivo (id_finca, nombre, tipo, area, fecha_siembra, fecha_cosecha_estimada,
                            ubicacion, observaciones, responsable, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idFinca,
        datos.nombre,
        datos.tipo ?? null,
        datos.area ?? null,
        datos.fecha_siembra,
        datos.fecha_cosecha_estimada ?? null,
        datos.ubicacion ?? null,
        datos.observaciones ?? null,
        responsable ?? null,
        creadoPor ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Actualiza datos del cultivo (lista blanca de columnas). */
  async update(id: number, datos: Partial<DatosCultivo>): Promise<void> {
    const campos = Object.keys(datos).filter((campo) =>
      (COLUMNAS_PERMITIDAS as readonly string[]).includes(campo)
    );

    if (campos.length === 0) return;

    const setClause = campos.map((campo) => `${campo} = ?`).join(', ');
    const valores = campos.map((campo) => (datos as Record<string, unknown>)[campo]);

    await pool.query(`UPDATE Cultivo SET ${setClause} WHERE id_cultivo = ?`, [...valores, id]);
  }

  /** Cambia la etapa del cultivo. */
  async cambiarEtapa(id: number, etapa: EtapaCultivo): Promise<void> {
    await pool.query('UPDATE Cultivo SET etapa = ? WHERE id_cultivo = ?', [etapa, id]);
  }

  /** Cambia el estado del cultivo (activo, finalizado, cancelado). */
  async cambiarEstado(id: number, estado: string): Promise<void> {
    await pool.query('UPDATE Cultivo SET estado = ? WHERE id_cultivo = ?', [estado, id]);
  }

  /** Registra la fecha real de cosecha. */
  async registrarCosecha(id: number, fecha: string): Promise<void> {
    await pool.query('UPDATE Cultivo SET fecha_cosecha_real = ? WHERE id_cultivo = ?', [fecha, id]);
  }

  /** Cuenta cuántos cultivos hay en cada etapa. */
  async contarPorEtapa(idFinca: number): Promise<{ etapa: string; cantidad: number }[]> {
    const [filas] = await pool.query<RowDataPacket[]>(
      `SELECT etapa, COUNT(*) AS cantidad
       FROM Cultivo
       WHERE id_finca = ? AND estado = 'ACTIVO'
       GROUP BY etapa`,
      [idFinca]
    );

    return filas.map((f) => ({ etapa: f.etapa, cantidad: Number(f.cantidad) }));
  }

  // --- Actividades agrícolas ---

  /** Lista las actividades de un cultivo (de más reciente a más antigua). */
  async findActividades(idCultivo: number): Promise<ActividadRow[]> {
    const [filas] = await pool.query<ActividadRow[]>(
      `SELECT a.*, u.nombre AS responsable
       FROM ActividadAgricola a
       LEFT JOIN Usuario u ON u.id_usuario = a.responsable
       WHERE a.id_cultivo = ?
       ORDER BY a.fecha DESC`,
      [idCultivo]
    );

    return filas;
  }

  /** Inserta una actividad agrícola. */
  async createActividad(
    datos: { fecha: string; tipo: TipoActividad; descripcion?: string; estado?: EstadoActividad; observaciones?: string },
    idCultivo: number,
    responsable?: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO ActividadAgricola (id_cultivo, fecha, tipo, descripcion, estado, responsable, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        idCultivo,
        datos.fecha,
        datos.tipo,
        datos.descripcion ?? null,
        datos.estado ?? 'COMPLETADA',
        responsable ?? null,
        datos.observaciones ?? null,
      ]
    );

    return resultado.insertId;
  }
}

export const cultivoRepository = new CultivoRepository();
