// ============================================================
// services/IndiceEstadoService.ts
// Calcula el ÍNDICE DE ESTADO DEL ANIMAL.
//
// IMPORTANTE: este índice es una herramienta ADMINISTRATIVA de
// seguimiento. NO es un diagnóstico veterinario.
//
// Reglas (en este orden, gana la primera que se cumple):
//   🔴 ATENCION    = hay vacunas/controles VENCIDOS
//                    o incidentes graves sin resolver
//   🟡 OBSERVACION = vencimientos en los próximos 15 días
//                    o sin pesaje en los últimos 90 días
//   🟢 OPTIMO      = en cualquier otro caso
//
// El resultado se guarda en la tabla Animal para poder filtrar
// rápido en el listado y en el panel de control.
// ============================================================

import { pool } from '../database/Conexion';
import { EstadoIndice } from '../models/Animal';
import { animalRepository } from '../repositories/AnimalRepository';
import { RowDataPacket } from 'mysql2/promise';

/** Días de anticipación para avisar de un vencimiento próximo. */
export const DIAS_AVISO = 15;

/** Días máximos sin pesaje antes de marcar "requiere observación". */
export const DIAS_SIN_PESAJE = 90;

/** Detalle del cálculo, útil para mostrar el "por qué" en la interfaz. */
export interface ResultadoIndice {
  estado: EstadoIndice;
  vencidos: number;
  incidentes_graves: number;
  proximos: number;
  dias_sin_pesaje: number;
}

export class IndiceEstadoService {
  /**
   * Calcula el índice de UN animal (sin guardarlo).
   * Se apoya en la vista vw_indice_estado, que ya hace los conteos.
   */
  async calcular(idAnimal: number): Promise<ResultadoIndice> {
    const [filas] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM vw_indice_estado WHERE id_animal = ? LIMIT 1',
      [idAnimal]
    );

    const fila = filas[0];

    // Si el animal no está activo la vista no lo devuelve
    if (!fila) {
      return {
        estado: 'OPTIMO',
        vencidos: 0,
        incidentes_graves: 0,
        proximos: 0,
        dias_sin_pesaje: 0,
      };
    }

    return {
      estado: fila.estado_indice as EstadoIndice,
      vencidos: Number(fila.registros_vencidos),
      incidentes_graves: Number(fila.incidentes_graves),
      proximos: Number(fila.vencimientos_proximos),
      dias_sin_pesaje: Number(fila.dias_sin_pesaje),
    };
  }

  /** Calcula y guarda el índice de un animal. */
  async actualizar(idAnimal: number): Promise<ResultadoIndice> {
    const resultado = await this.calcular(idAnimal);

    await animalRepository.actualizarIndice(idAnimal, resultado.estado);

    return resultado;
  }

  /**
   * Recalcula el índice de todos los animales activos de la finca.
   * Útil cuando se registran vacunas, tratamientos o pesajes
   * (cada módulo llamará a `actualizar` del animal afectado).
   */
  async recalcularTodos(idFinca: number): Promise<{ revisados: number }> {
    const ids = await animalRepository.idsActivos(idFinca);

    for (const id of ids) {
      await this.actualizar(id);
    }

    return { revisados: ids.length };
  }
}

export const indiceEstadoService = new IndiceEstadoService();
