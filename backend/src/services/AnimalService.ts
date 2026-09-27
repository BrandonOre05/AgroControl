// ============================================================
// services/AnimalService.ts
// Reglas de negocio del módulo de animales:
//   - el código debe ser único dentro de la finca,
//   - el animal debe existir antes de modificarlo,
//   - después de cada cambio se recalcula el Índice de Estado.
// ============================================================

import {
  Animal,
  DatosActualizacionAnimal,
  DatosAnimal,
  EstadoAnimal,
  EventoHistorial,
  FiltrosAnimal,
} from '../models/Animal';
import { animalRepository } from '../repositories/AnimalRepository';
import { historialRepository } from '../repositories/HistorialRepository';
import { AppError } from '../utils/AppError';
import { fincaService } from './FincaService';
import { indiceEstadoService } from './IndiceEstadoService';

export class AnimalService {
  /** Lista los animales de la finca con filtros opcionales. */
  async listar(filtros: FiltrosAnimal): Promise<Animal[]> {
    const idFinca = await fincaService.obtenerId();
    return animalRepository.findAll(idFinca, filtros);
  }

  /** Obtiene un animal por id. */
  async obtenerPorId(id: number): Promise<Animal> {
    const animal = await animalRepository.findById(id);

    if (!animal) {
      throw new AppError('Animal no encontrado', 404);
    }

    return animal;
  }

  /** Historial cronológico de un animal. */
  async obtenerHistorial(id: number): Promise<EventoHistorial[]> {
    // Verificamos que el animal exista (si no, devolvemos 404)
    await this.obtenerPorId(id);

    return historialRepository.porAnimal(id);
  }

  /** Registra un animal nuevo. */
  async crear(datos: DatosAnimal, idUsuario: number): Promise<Animal> {
    const idFinca = await fincaService.obtenerId();

    // El código no se puede repetir dentro de la misma finca
    const existente = await animalRepository.findByCodigo(idFinca, datos.codigo);
    if (existente) {
      throw new AppError(`Ya existe un animal con el código ${datos.codigo}`, 409);
    }

    const id = await animalRepository.create(datos, idFinca, idUsuario);

    // Calculamos el índice (un animal nuevo normalmente es ÓPTIMO)
    await indiceEstadoService.actualizar(id);

    return this.obtenerPorId(id);
  }

  /** Actualiza los datos de un animal. */
  async actualizar(id: number, datos: DatosActualizacionAnimal): Promise<Animal> {
    await this.obtenerPorId(id); // Si no existe, lanza 404

    await animalRepository.update(id, datos);

    return this.obtenerPorId(id);
  }

  /**
   * Cambia el estado del animal (VENDIDO, FALECIDO, TRANSFERIDO...).
   * No se borra físicamente: se conserva el historial del animal.
   */
  async cambiarEstado(id: number, estado: EstadoAnimal): Promise<Animal> {
    await this.obtenerPorId(id);

    await animalRepository.actualizarEstado(id, estado);

    // Si deja de estar activo, el índice deja de aplicar
    if (estado !== 'ACTIVO') {
      await animalRepository.actualizarIndice(id, 'OPTIMO');
    }

    return this.obtenerPorId(id);
  }

  /** Recalcula el índice de todos los animales activos. */
  async recalcularIndices(): Promise<{ revisados: number }> {
    const idFinca = await fincaService.obtenerId();
    return indiceEstadoService.recalcularTodos(idFinca);
  }
}

export const animalService = new AnimalService();
