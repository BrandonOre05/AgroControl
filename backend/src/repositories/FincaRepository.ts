// ============================================================
// repositories/FincaRepository.ts
// Consultas SQL de la tabla Finca.
//
// En la primera versión se trabaja con UNA sola finca, por eso
// existe `obtenerPrincipal()` que devuelve la primera registrada.
// ============================================================

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import { DatosFinca, Finca } from '../models/Finca';

type FincaRow = Finca & RowDataPacket;

/**
 * Lista blanca de columnas que se pueden modificar.
 * Aunque el cliente mande otro nombre de campo, se ignora.
 * Esto evita que alguien intente escribir en `estado` o `id_finca`.
 */
const COLUMNAS_PERMITIDAS = [
  'nombre',
  'ubicacion',
  'extension',
  'descripcion',
  'tipo_produccion',
  'contacto_telefono',
  'contacto_correo',
] as const;

export class FincaRepository {
  /** Devuelve la finca principal (la primera registrada). */
  async obtenerPrincipal(): Promise<FincaRow | null> {
    const [filas] = await pool.query<FincaRow[]>(
      'SELECT * FROM Finca ORDER BY id_finca ASC LIMIT 1'
    );

    return filas[0] ?? null;
  }

  /** Devuelve la finca por su id. */
  async obtenerPorId(id: number): Promise<FincaRow | null> {
    const [filas] = await pool.query<FincaRow[]>('SELECT * FROM Finca WHERE id_finca = ?', [id]);

    return filas[0] ?? null;
  }

  /** Inserta una finca y devuelve su id. */
  async create(datos: DatosFinca): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Finca (nombre, ubicacion, extension, descripcion, tipo_produccion,
                          contacto_telefono, contacto_correo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.nombre,
        datos.ubicacion ?? null,
        datos.extension ?? null,
        datos.descripcion ?? null,
        datos.tipo_produccion ?? 'MIXTA',
        datos.contacto_telefono ?? null,
        datos.contacto_correo ?? null,
      ]
    );

    return resultado.insertId;
  }

  /**
   * Actualiza la finca usando solo las columnas permitidas.
   * Los valores siempre van con ? (consulta parametrizada).
   */
  async actualizar(id: number, datos: Partial<DatosFinca>): Promise<void> {
    const campos = Object.keys(datos).filter((campo) =>
      (COLUMNAS_PERMITIDAS as readonly string[]).includes(campo)
    );

    if (campos.length === 0) return;

    const setClause = campos.map((campo) => `${campo} = ?`).join(', ');
    const valores = campos.map((campo) => (datos as Record<string, unknown>)[campo]);

    await pool.query(`UPDATE Finca SET ${setClause} WHERE id_finca = ?`, [...valores, id]);
  }

  /** Cuenta cuántas fincas hay (para no crear más de una). */
  async contar(): Promise<number> {
    const [filas] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM Finca');

    return Number(filas[0]?.total ?? 0);
  }
}

export const fincaRepository = new FincaRepository();
