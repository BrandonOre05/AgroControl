// ============================================================
// server.ts
// Punto de entrada del backend.
//
// Orden de arranque:
//   1. Comprobar que MySQL responde.
//   2. Levantar el servidor Express en el puerto configurado.
// ============================================================

import app from './app';
import { env } from './config/env';
import { testConnection } from './database/Conexion';

async function main() {
  // 1. Verificamos la base de datos antes de aceptar peticiones
  try {
    await testConnection();
  } catch (error) {
    console.error('No se pudo conectar a MySQL:', error);
    console.error('Revisa las variables DB_* del archivo .env');
    process.exit(1); // Termina el programa con código de error
  }

  // 2. Levantamos el servidor
  const servidor = app.listen(env.port, () => {
    console.log(`AgroControl API escuchando en http://localhost:${env.port}`);
  });

  // Si el puerto ya está ocupado lo decimos con un mensaje claro,
  // en vez de mostrar un error técnico lleno de líneas.
  servidor.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`El puerto ${env.port} ya está en uso.`);
      console.error('Es probable que haya otra instancia del servidor corriendo.');
      console.error('Cierra la otra terminal o cambia el puerto en el .env (PORT=3001).');
    } else {
      console.error('Error al iniciar el servidor:', error);
    }

    process.exit(1);
  });
}

main();
