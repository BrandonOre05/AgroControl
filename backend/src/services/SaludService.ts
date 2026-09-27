// ============================================================
// services/SaludService.ts
// Reglas de negocio del módulo de salud.
//
// Idea central: los cinco eventos (vacuna, tratamiento, control,
// pesaje e incidente) se registran de la misma manera:
//   1. Verificar que el animal exista y esté ACTIVO.
//   2. Guardar el evento.
//   3. Recalcular el Índice de Estado del animal.
// Por eso hay un método privado que hace la parte común y cada
// método público solo aporta sus datos.
// ============================================================

import { Animal, EstadoIndice } from '../models/Animal';
import { ProximoEvento } from '../models/Salud';
import { animalRepository } from '../repositories/AnimalRepository';
import { saludRepository } from '../repositories/SaludRepository';
import { AppError } from '../utils/AppError';
import { indiceEstadoService } from './IndiceEstadoService';
import { fincaService } from './FincaService';

/** Respuesta común al registrar un evento de salud. */
interface ResultadoRegistro {
  id_evento: number;
  estado_indice: EstadoIndice;
}

export class SaludService {
  /**
   * Verifica que el animal exista y esté activo.
   * Los datos se guardan siempre en un animal ACTIVO: si ya fue
   * vendido o falleció, no tiene sentido registrarle controles.
   */
  private async obtenerAnimalActivo(idAnimal: number): Promise<Animal> {
    if (!Number.isInteger(idAnimal) || idAnimal <= 0) {
      throw new AppError('El identificador del animal no es válido', 400);
    }

    const animal = await animalRepository.findById(idAnimal);

    if (!animal) {
      throw new AppError('Animal no encontrado', 404);
    }

    if (animal.estado_animal !== 'ACTIVO') {
      throw new AppError(
        `El animal ${animal.codigo} no está activo (estado: ${animal.estado_animal}). No se pueden registrar eventos de salud.`,
        409
      );
    }

    return animal;
  }

  /** Registra un evento y recalcula el índice del animal. */
  private async registrar(
    idAnimal: number,
    idUsuario: number,
    insertar: () => Promise<number>
  ): Promise<ResultadoRegistro> {
    await this.obtenerAnimalActivo(idAnimal);

    const idEvento = await insertar();

    // El índice depende de estos eventos, así que se recalcula
    const indice = await indiceEstadoService.actualizar(idAnimal);

    return { id_evento: idEvento, estado_indice: indice.estado };
  }

  /** Registra una vacuna. */
  async registrarVacuna(
    idAnimal: number,
    idUsuario: number,
    datos: {
      nombre: string;
      fecha: string;
      proxima_fecha?: string;
      dosis?: string;
      descripcion?: string;
      id_producto?: number;
    }
  ): Promise<ResultadoRegistro> {
    return this.registrar(idAnimal, idUsuario, () =>
      saludRepository.createVacuna(datos, idAnimal, idUsuario)
    );
  }

  /** Registra un tratamiento. */
  async registrarTratamiento(
    idAnimal: number,
    idUsuario: number,
    datos: {
      nombre: string;
      fecha_inicio: string;
      fecha_fin?: string;
      dosis?: string;
      descripcion?: string;
      id_producto?: number;
    }
  ): Promise<ResultadoRegistro> {
    return this.registrar(idAnimal, idUsuario, () =>
      saludRepository.createTratamiento(datos, idAnimal, idUsuario)
    );
  }

  /** Registra un control o revisión. */
  async registrarControl(
    idAnimal: number,
    idUsuario: number,
    datos: {
      fecha: string;
      tipo: 'GENERAL' | 'CLINICO' | 'LABORATORIO' | 'REPRODUCTIVO' | 'OTRO';
      descripcion?: string;
      proxima_fecha?: string;
    }
  ): Promise<ResultadoRegistro> {
    return this.registrar(idAnimal, idUsuario, () =>
      saludRepository.createControl(datos, idAnimal, idUsuario)
    );
  }

  /** Registra un pesaje. */
  async registrarPesaje(
    idAnimal: number,
    idUsuario: number,
    datos: { peso: number; fecha?: string; descripcion?: string }
  ): Promise<ResultadoRegistro> {
    return this.registrar(idAnimal, idUsuario, () =>
      saludRepository.createPesaje(datos, idAnimal, idUsuario)
    );
  }

  /** Registra un incidente. */
  async registrarIncidente(
    idAnimal: number,
    idUsuario: number,
    datos: {
      fecha?: string;
      tipo: 'LESION' | 'ENFERMEDAD' | 'ACCIDENTE' | 'COMPORTAMIENTO' | 'OTRO';
      gravedad: 'LEVE' | 'MODERADA' | 'GRAVE';
      descripcion: string;
      descripcion_extra?: string;
      resuelto?: boolean;
    }
  ): Promise<ResultadoRegistro> {
    return this.registrar(idAnimal, idUsuario, () =>
      saludRepository.createIncidente(datos, idAnimal, idUsuario)
    );
  }

  /**
   * Resumen sanitario de todos los animales activos.
   * Lo usa la pantalla "Salud" para ver de un vistazo qué falta
   * por aplicar (vacunas y controles programados en los próximos días).
   */
  async resumenGeneral(dias = 30) {
    const idFinca = await fincaService.obtenerId();
    return saludRepository.resumenPorAnimal(idFinca, dias);
  }

  /**
   * Próximos eventos de salud programados para un animal.
   * Sirve para mostrar "qué viene" y alimentar las alertas.
   */
  async proximosEventos(idAnimal: number, dias = 30): Promise<ProximoEvento[]> {
    await this.obtenerAnimalActivo(idAnimal);

    // Límite razonable: entre 1 y 365 días
    const diasSeguro = Math.min(Math.max(dias, 1), 365);

    return saludRepository.proximosEventos(idAnimal, diasSeguro);
  }
}

export const saludService = new SaludService();
