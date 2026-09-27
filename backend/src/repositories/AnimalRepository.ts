// ============================================================
// repositories/AnimalRepository.ts
// Consultas SQL de la tabla Animal.
// ============================================================

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import { Animal, DatosActualizacionAnimal, DatosAnimal, FiltrosAnimal } from '../models/Animal';

type AnimalRow = Animal & RowDataPacket;

/** Solo estas columnas se pueden modificar (el id y el código no). */
const COLUMNAS_PERMITIDAS = [
  'nombre',
  'especie',
  'raza',
  'sexo',
  'fecha_nacimiento',
  'fecha_ingreso',
  'ubicacion_finca',
  'observaciones',
] as const;

/** Columnas que siempre se devuelven (incluye el último peso calculado). */
const COLUMNAS_LECTURA = `
  a.id_animal, a.id_finca, a.codigo, a.nombre, a.especie, a.raza, a.sexo,
  a.fecha_nacimiento, a.fecha_ingreso, a.ubicacion_finca, a.estado_animal,
  a.observaciones, a.estado_indice, a.estado_indice_fecha,
  a.fecha_creacion, a.fecha_modificacion,
  (SELECT p.peso FROM Pesaje p WHERE p.id_animal = a.id_animal
   ORDER BY p.fecha DESC LIMIT 1) AS ultimo_peso
`;

export class AnimalRepository {
  /**
   * Lista los animales de una finca con filtros opcionales.
   * Cada filtro agrega una condición con ? (nunca se concatena texto).
   */
  async findAll(idFinca: number, filtros: FiltrosAnimal = {}): Promise<AnimalRow[]> {
    const condiciones: string[] = ['a.id_finca = ?'];
    const valores: unknown[] = [idFinca];

    if (filtros.estado_indice) {
      condiciones.push('a.estado_indice = ?');
      valores.push(filtros.estado_indice);
    }

    if (filtros.estado_animal) {
      condiciones.push('a.estado_animal = ?');
      valores.push(filtros.estado_animal);
    }

    if (filtros.especie) {
      condiciones.push('a.especie = ?');
      valores.push(filtros.especie);
    }

    if (filtros.texto) {
      // Búsqueda aproximada en código, nombre o raza
      condiciones.push('(a.codigo LIKE ? OR a.nombre LIKE ? OR a.raza LIKE ?)');
      const patron = `%${filtros.texto}%`;
      valores.push(patron, patron, patron);
    }

    const [filas] = await pool.query<AnimalRow[]>(
      `SELECT ${COLUMNAS_LECTURA}
       FROM Animal a
       WHERE ${condiciones.join(' AND ')}
       ORDER BY a.codigo ASC`,
      valores
    );

    return filas;
  }

  /** Busca un animal por su id. */
  async findById(id: number): Promise<AnimalRow | null> {
    const [filas] = await pool.query<AnimalRow[]>(
      `SELECT ${COLUMNAS_LECTURA} FROM Animal a WHERE a.id_animal = ? LIMIT 1`,
      [id]
    );

    return filas[0] ?? null;
  }

  /** Busca un animal por su código dentro de una finca. */
  async findByCodigo(idFinca: number, codigo: string): Promise<AnimalRow | null> {
    const [filas] = await pool.query<AnimalRow[]>(
      `SELECT ${COLUMNAS_LECTURA} FROM Animal a WHERE a.id_finca = ? AND a.codigo = ? LIMIT 1`,
      [idFinca, codigo]
    );

    return filas[0] ?? null;
  }

  /** Inserta un animal y devuelve su id. */
  async create(datos: DatosAnimal, idFinca: number, creadoPor?: number): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Animal (id_finca, codigo, nombre, especie, raza, sexo,
                           fecha_nacimiento, fecha_ingreso, ubicacion_finca,
                           observaciones, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idFinca,
        datos.codigo,
        datos.nombre ?? null,
        datos.especie,
        datos.raza ?? null,
        datos.sexo,
        datos.fecha_nacimiento ?? null,
        datos.fecha_ingreso,
        datos.ubicacion_finca ?? null,
        datos.observaciones ?? null,
        creadoPor ?? null,
      ]
    );

    return resultado.insertId;
  }

  /**
   * Actualiza un animal.
   * Solo se usan las columnas de la lista blanca, con valores parametrizados.
   */
  async update(id: number, datos: DatosActualizacionAnimal): Promise<void> {
    const campos = Object.keys(datos).filter((campo) =>
      (COLUMNAS_PERMITIDAS as readonly string[]).includes(campo)
    );

    if (campos.length === 0) return;

    const setClause = campos.map((campo) => `${campo} = ?`).join(', ');
    const valores = campos.map((campo) => (datos as Record<string, unknown>)[campo]);

    await pool.query(`UPDATE Animal SET ${setClause} WHERE id_animal = ?`, [...valores, id]);
  }

  /** Cambia el estado del animal (ACTIVO, VENDIDO, FALECIDO...). */
  async actualizarEstado(id: number, estado: string): Promise<void> {
    await pool.query('UPDATE Animal SET estado_animal = ? WHERE id_animal = ?', [estado, id]);
  }

  /** Guarda el resultado del Índice de Estado del Animal. */
  async actualizarIndice(id: number, estado: string): Promise<void> {
    await pool.query(
      'UPDATE Animal SET estado_indice = ?, estado_indice_fecha = NOW() WHERE id_animal = ?',
      [estado, id]
    );
  }

  /** Ids de todos los animales activos (para recalcular el índice en lote). */
  async idsActivos(idFinca: number): Promise<number[]> {
    const [filas] = await pool.query<RowDataPacket[]>(
      "SELECT id_animal FROM Animal WHERE id_finca = ? AND estado_animal = 'ACTIVO'",
      [idFinca]
    );

    return filas.map((fila) => Number(fila.id_animal));
  }
}

export const animalRepository = new AnimalRepository();
