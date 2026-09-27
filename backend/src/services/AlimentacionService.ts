// ============================================================
// services/AlimentacionService.ts
// Reglas de negocio de la alimentación.
// ============================================================

import { Alimentacion, DatosAlimentacion, FiltrosAlimentacion } from '../models/Alimentacion';
import { alimentacionRepository } from '../repositories/AlimentacionRepository';
import { animalRepository } from '../repositories/AnimalRepository';
import { AppError } from '../utils/AppError';

export class AlimentacionService {
  /** Registra una alimentación (y descuenta el insumo si corresponde). */
  async registrar(
    datos: DatosAlimentacion,
    idUsuario: number
  ): Promise<{ id_alimentacion: number; stock_restante: number | null }> {
    // Si se registró para un animal puntual, debe existir y estar activo
    if (datos.id_animal) {
      const animal = await animalRepository.findById(datos.id_animal);

      if (!animal) {
        throw new AppError('Animal no encontrado', 404);
      }

      if (animal.estado_animal !== 'ACTIVO') {
        throw new AppError(
          `El animal ${animal.codigo} no está activo, no se puede registrar alimentación`,
          409
        );
      }
    }

    try {
      return await alimentacionRepository.registrar(datos, idUsuario);
    } catch (error) {
      const codigo = (error as Error).message;

      if (codigo === 'PRODUCTO_NO_ENCONTRADO') {
        throw new AppError('El producto de inventario no existe', 404);
      }

      if (codigo === 'STOCK_INSUFICIENTE') {
        throw new AppError(
          'No hay suficiente inventario del alimento seleccionado para esta salida',
          409
        );
      }

      throw error;
    }
  }

  /** Lista los registros de alimentación. */
  async listar(filtros: FiltrosAlimentacion): Promise<Alimentacion[]> {
    return alimentacionRepository.findAll(filtros);
  }
}

export const alimentacionService = new AlimentacionService();
