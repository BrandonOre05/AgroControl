// ============================================================
// services/ActividadService.ts
// Reglas de negocio de las tareas del personal.
// ============================================================

import { Actividad, DatosActividad, EstadoTarea, FiltrosActividad } from '../models/Actividad';
import { actividadRepository } from '../repositories/ActividadRepository';
import { AppError } from '../utils/AppError';
import { fincaService } from './FincaService';

export class ActividadService {
  /** Lista actividades con filtros. */
  async listar(filtros: FiltrosActividad): Promise<Actividad[]> {
    const idFinca = await fincaService.obtenerId();
    return actividadRepository.findAll(idFinca, filtros);
  }

  /** Contadores por estado (para las pestañas). */
  async resumen(): Promise<{ estado: string; cantidad: number }[]> {
    const idFinca = await fincaService.obtenerId();
    return actividadRepository.contarPorEstado(idFinca);
  }

  /** Obtiene una actividad por id. */
  async obtenerPorId(id: number): Promise<Actividad> {
    const actividad = await actividadRepository.findById(id);

    if (!actividad) {
      throw new AppError('Actividad no encontrada', 404);
    }

    return actividad;
  }

  /** Crea una tarea. */
  async crear(datos: DatosActividad): Promise<Actividad> {
    const idFinca = await fincaService.obtenerId();

    const id = await actividadRepository.create(datos, idFinca);

    return this.obtenerPorId(id);
  }

  /** Actualiza una tarea. */
  async actualizar(id: number, datos: Partial<DatosActividad>): Promise<Actividad> {
    await this.obtenerPorId(id);

    await actividadRepository.update(id, datos);

    return this.obtenerPorId(id);
  }

  /**
   * Cambia el estado de una tarea.
   * Cualquier rol puede marcar avance (registrar_avance en la matriz);
   * quien no puede editar la tarea en sí.
   */
  async cambiarEstado(id: number, estado: EstadoTarea): Promise<Actividad> {
    await this.obtenerPorId(id);

    await actividadRepository.cambiarEstado(id, estado);

    return this.obtenerPorId(id);
  }
}

export const actividadService = new ActividadService();
