// ============================================================
// config/env.ts
// Lee las variables del archivo .env en un solo lugar.
// Así el resto del proyecto usa `env.port` en vez de repetir
// process.env por todos lados, y si falta un dato importante
// el programa se detiene con un mensaje claro.
// ============================================================

import dotenv from 'dotenv';

dotenv.config(); // Carga las variables del archivo .env

/**
 * Devuelve una variable obligatoria.
 * Si no está definida, detiene el programa explicando cuál falta.
 */
function requerida(nombre: string): string {
  const valor = process.env[nombre];

  if (!valor) {
    throw new Error(
      `Falta la variable ${nombre} en el archivo .env (copia .env.example y complétalo)`
    );
  }

  return valor;
}

/** Configuración general del proyecto, leída una sola vez al arrancar. */
export const env = {
  // Puerto del servidor
  port: Number(process.env.PORT ?? 3000),

  // Autenticación (JWT)
  jwtSecret: requerida('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',

  // CORS: solo el frontend declarado puede llamar a la API
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',

  // Base de datos MySQL
  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: requerida('DB_NAME'),
  },
};
