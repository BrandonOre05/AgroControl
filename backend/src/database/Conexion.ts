// ============================================================
// database/Conexion.ts
// Crea el "pool" de conexiones a MySQL.
//
// ¿Qué es un pool? En vez de abrir y cerrar una conexión nueva
// en cada consulta (que es lento), se abren varias conexiones una
// sola vez y se van reutilizando según se necesiten.
// ============================================================

import mysql from 'mysql2/promise';
import { env } from '../config/env';

// El pool es el objeto que usarán los repositorios para consultar la BD.
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  charset: 'utf8mb4', // Acentos y caracteres especiales (ñ, á, é...)

  waitForConnections: true, // Espera si todas las conexiones están ocupadas
  connectionLimit: 10, // Máximo de conexiones simultáneas
  queueLimit: 0, // 0 = cola ilimitada (en espera)
});

/**
 * Comprueba que la base de datos responde.
 * Se ejecuta al arrancar el servidor: si MySQL está apagado o la
 * configuración está mal, lo sabremos de inmediato y no al
 * hacer la primera consulta.
 */
export async function testConnection(): Promise<void> {
  const conexion = await pool.getConnection();

  try {
    await conexion.query('SELECT 1'); // Consulta mínima: siempre devuelve 1
    console.log(`Conexión a MySQL establecida (base: ${env.db.database})`);
  } finally {
    // Devuelve la conexión al pool, aunque algo haya fallado
    conexion.release();
  }
}
