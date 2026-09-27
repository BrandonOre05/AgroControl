// ============================================================
// middlewares/ErrorMiddleware.ts
// Manejo centralizado de errores.
//
// Todas las rutas usan el patrón try/catch y delegan el error
// con next(error). Aquí se recoge todo y se responde con JSON.
//
// Regla de seguridad: en errores 500 (del servidor) NUNCA se
// muestra el mensaje real al usuario, porque podría revelar
// detalles internos (nombres de tablas, consultas SQL...).
// El detalle real se queda en la consola del servidor.
// ============================================================

import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';

/** Se ejecuta al final de todas las rutas, cuando hay un error. */
export function errorHandler(
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: unknown
) {
  const status = (error as AppError).status ?? 500;

  // En 500 mostramos un mensaje genérico; en el resto, el mensaje real
  const mensaje = status === 500 ? 'Error interno del servidor' : error.message;

  // El error completo (con stack y mensaje real) queda en el log del servidor
  if (status === 500) {
    console.error('Error interno:', error);
  }

  res.status(status).json({ mensaje });
}

/** Se ejecuta si ninguna ruta coincidió con la URL solicitada. */
export function rutaNoEncontrada(_req: Request, res: Response) {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
}
