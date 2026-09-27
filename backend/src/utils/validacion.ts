// ============================================================
// utils/validacion.ts
// Helper reutilizable para validar los datos que envía el cliente
// con Zod.
//
// ¿Por qué validar en el backend? Porque el frontend se puede
// modificar: la única validación confiable es la que hace la API.
// ============================================================

import { z } from 'zod';
import { AppError } from './AppError';

/**
 * Valida `datos` contra un esquema Zod.
 * - Si todo está bien, devuelve los datos ya limpios y tipados.
 * - Si hay un error, lanza AppError 400 con el primer mensaje.
 */
export function validar<T>(schema: z.ZodType<T>, datos: unknown): T {
  const resultado = schema.safeParse(datos);

  if (!resultado.success) {
    // issues contiene la lista de problemas encontrados
    const primerProblema = resultado.error.issues[0];
    throw new AppError(primerProblema?.message ?? 'Datos inválidos', 400);
  }

  return resultado.data;
}

/**
 * Convierte en número un id que viene en la URL (req.params.id).
 *
 * ¿Por qué hace falta? Lo que llega por la URL es TEXTO. Si alguien
 * pide /api/animales/abc, entonces Number('abc') devuelve NaN, y un
 * NaN que llega a la consulta SQL revienta la conexión con MySQL:
 * la API termina respondiendo 500 "error del servidor" cuando el
 * problema real es un id mal escrito, que es un error 400.
 *
 * Con este helper la respuesta correcta es:
 *   400 { "mensaje": "Identificador de animal no válido: \"abc\"" }
 *
 * @param valor  lo que llegó en la URL (req.params.id)
 * @param nombre qué recurso es, para que el mensaje se entienda
 */
export function idEntero(valor: string | number, nombre = 'registro'): number {
  const id = typeof valor === 'number' ? valor : Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Identificador de ${nombre} no válido: "${valor}"`, 400);
  }

  return id;
}
