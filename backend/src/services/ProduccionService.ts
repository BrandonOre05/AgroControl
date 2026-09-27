// ============================================================
// services/ProduccionService.ts
// Reglas de negocio de la producción.
// ============================================================

import { FiltrosProduccion, ProduccionAgricola, ProduccionGanadera, TipoProduccion } from '../models/Produccion';
import { animalRepository } from '../repositories/AnimalRepository';
import { cultivoRepository } from '../repositories/CultivoRepository';
import { produccionRepository } from '../repositories/ProduccionRepository';
import { AppError } from '../utils/AppError';
import { fincaService } from './FincaService';

export class ProduccionService {
  // ---------- Ganadera ----------

  /** Registra producción de un animal (leche, peso, huevos...). */
  async registrarGanadera(
    datos: { id_animal: number; tipo: TipoProduccion; cantidad: number; unidad: string; fecha: string; observaciones?: string },
    idUsuario: number
  ): Promise<ProduccionGanadera> {
    // El animal debe existir
    const animal = await animalRepository.findById(datos.id_animal);
    if (!animal) {
      throw new AppError('Animal no encontrado', 404);
    }

    // No se registra producción de animales que ya no están en la finca
    if (animal.estado_animal !== 'ACTIVO') {
      throw new AppError(
        `El animal ${animal.codigo} no está activo, no se puede registrar producción`,
        409
      );
    }

    await produccionRepository.createGanadera(datos, idUsuario);

    const lista = await this.listarGanadera({ id_animal: datos.id_animal });

    return lista[0];
  }

  /** Lista producción ganadera con filtros. */
  async listarGanadera(filtros: FiltrosProduccion): Promise<ProduccionGanadera[]> {
    const idFinca = await fincaService.obtenerId();
    return produccionRepository.findGanadera(idFinca, filtros);
  }

  // ---------- Agrícola ----------

  /** Registra una cosecha. */
  async registrarAgricola(
    datos: { id_cultivo: number; producto: string; cantidad: number; unidad: string; fecha_cosecha: string; observaciones?: string },
    idUsuario: number
  ): Promise<ProduccionAgricola> {
    const cultivo = await cultivoRepository.findById(datos.id_cultivo);
    if (!cultivo) {
      throw new AppError('Cultivo no encontrado', 404);
    }

    if (cultivo.estado === 'CANCELADO') {
      throw new AppError('El cultivo está cancelado, no se puede registrar cosecha', 409);
    }

    await produccionRepository.createAgricola(datos, idUsuario);

    const lista = await produccionRepository.findAgricola(await fincaService.obtenerId());

    return lista[0];
  }

  /** Lista la producción agrícola. */
  async listarAgricola(dias?: number): Promise<ProduccionAgricola[]> {
    const idFinca = await fincaService.obtenerId();
    return produccionRepository.findAgricola(idFinca, dias);
  }

  // ---------- Resumen para el panel ----------

  /**
   * Datos completos de la pantalla de producción:
   * tarjetas, gráfica y ranking de animales.
   */
  async resumen(dias = 30) {
    const idFinca = await fincaService.obtenerId();

    const [totales, porDia, top, cosecha] = await Promise.all([
      produccionRepository.totalesPorTipo(idFinca, dias),
      produccionRepository.porDia(idFinca, dias, 'LECHE'),
      produccionRepository.topAnimales(idFinca, 'LECHE', dias, 5),
      produccionRepository.totalAgricola(idFinca, dias),
    ]);

    return {
      dias,
      totales,
      por_dia: porDia,
      top_animales: top,
      cosecha_agricola: cosecha,
    };
  }
}

export const produccionService = new ProduccionService();
