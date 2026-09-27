// ============================================================
// repositories/UsuarioRepository.ts
// Única capa que habla SQL con la tabla Usuario.
//
// Reglas:
//  1. Siempre consultas parametrizadas (con ?). Nunca se concatena
//     texto del usuario dentro del SQL, así no hay inyección SQL.
//  2. Se listan las columnas explícitamente (nunca SELECT *) para no
//     arrastrar el campo password por error.
// ============================================================

import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import { EstadoUsuario, Rol, Usuario } from '../models/Usuario';

// mysql2 exige que las filas incluyan RowDataPacket
type UsuarioRow = Usuario & RowDataPacket;

// Permite trabajar con el pool normal o con una conexión de una transacción
type ClienteDB = Pool | PoolConnection;

export class UsuarioRepository {
  /**
   * Busca un usuario por correo.
   * @param conPassword Si es true, incluye el hash (solo para comparar
   *                    contraseñas en el login).
   */
  async findByCorreo(correo: string, conPassword = false): Promise<UsuarioRow | null> {
    // Estas dos listas son fijas y están definidas aquí mismo,
    // nunca vienen del cliente, por eso es seguro usarlas en el SQL.
    const columnas = conPassword
      ? 'id_usuario, nombre, correo, password, rol, estado, telefono, ultimo_login, fecha_creacion'
      : 'id_usuario, nombre, correo, rol, estado, telefono, ultimo_login, fecha_creacion';

    const [filas] = await pool.query<UsuarioRow[]>(
      `SELECT ${columnas} FROM Usuario WHERE correo = ? LIMIT 1`,
      [correo]
    );

    return filas[0] ?? null;
  }

  /** Busca un usuario por su id (sin el hash de contraseña). */
  async findById(id: number): Promise<UsuarioRow | null> {
    const [filas] = await pool.query<UsuarioRow[]>(
      `SELECT id_usuario, nombre, correo, rol, estado, telefono, ultimo_login, fecha_creacion
       FROM Usuario WHERE id_usuario = ? LIMIT 1`,
      [id]
    );

    return filas[0] ?? null;
  }

  /**
   * Busca un usuario por id INCLUYENDO el hash.
   * Solo se usa para verificar contraseñas (login, cambio de contraseña).
   */
  async findByIdConPassword(id: number): Promise<UsuarioRow | null> {
    const [filas] = await pool.query<UsuarioRow[]>(
      `SELECT id_usuario, nombre, correo, password, rol, estado, telefono, ultimo_login, fecha_creacion
       FROM Usuario WHERE id_usuario = ? LIMIT 1`,
      [id]
    );

    return filas[0] ?? null;
  }

  /** Lista todos los usuarios (para el módulo de administración). */
  async findAll(): Promise<UsuarioRow[]> {
    const [filas] = await pool.query<UsuarioRow[]>(
      `SELECT id_usuario, nombre, correo, rol, estado, telefono, ultimo_login, fecha_creacion
       FROM Usuario ORDER BY nombre ASC`
    );

    return filas;
  }

  /** Inserta un usuario y devuelve su id. */
  async create(
    datos: {
      nombre: string;
      correo: string;
      password: string; // Ya viene cifrada con bcrypt
      rol: Rol;
      telefono?: string;
    },
    creadoPor?: number,
    conexion: ClienteDB = pool
  ): Promise<number> {
    const [resultado] = await conexion.query<ResultSetHeader>(
      `INSERT INTO Usuario (nombre, correo, password, rol, telefono, creado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        datos.nombre,
        datos.correo,
        datos.password,
        datos.rol,
        datos.telefono ?? null,
        creadoPor ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Registra el último inicio de sesión exitoso. */
  async registrarUltimoLogin(id: number): Promise<void> {
    await pool.query('UPDATE Usuario SET ultimo_login = NOW() WHERE id_usuario = ?', [id]);
  }

  /** Cambia el estado de la cuenta (ACTIVO / INACTIVO / SUSPENDIDO). */
  async actualizarEstado(id: number, estado: EstadoUsuario): Promise<void> {
    await pool.query('UPDATE Usuario SET estado = ? WHERE id_usuario = ?', [estado, id]);
  }

  /** Cambia el rol de un usuario. */
  async actualizarRol(id: number, rol: Rol): Promise<void> {
    await pool.query('UPDATE Usuario SET rol = ? WHERE id_usuario = ?', [rol, id]);
  }

  /**
   * Actualiza campos concretos (nombre, telefono...).
   * El service decide qué campos y en qué orden; aquí se arma
   * la consulta con valores parametrizados.
   */
  async actualizarCampos(id: number, campos: string[], valores: unknown[]): Promise<void> {
    if (campos.length === 0) return;

    const setClause = campos.join(', ');

    await pool.query(`UPDATE Usuario SET ${setClause} WHERE id_usuario = ?`, [...valores, id]);
  }

  /** Guarda una nueva contraseña (ya cifrada con bcrypt). */
  async actualizarPassword(id: number, hash: string): Promise<void> {
    await pool.query('UPDATE Usuario SET password = ? WHERE id_usuario = ?', [hash, id]);
  }
}

export const usuarioRepository = new UsuarioRepository();
