// ============================================================
// services/CultivoService.ts
// Reglas de negocio de los cultivos.
//
// Lo más importante aquí: el CICLO DE VIDA del cultivo.
// Las etapas siempre avanzan en orden:
//
//   PREPARACION → SIEMBRA → CRECIMIENTO → MANTENIMIENTO → COSECHA → FINALIZADA
//
// Al llegar a FINALIZADA se guarda la fecha real de cosecha y el
// cultivo deja de estar activo. Si se regresa a una etapa
// anterior, vuelve a estar activo.
// ============================================================

import { ActividadAgricola, Cultivo, DatosCultivo, EtapaCultivo } from '../models/Cultivo';
import { cultivoRepository } from '../repositories/CultivoRepository';
import { AppError } from '../utils/AppError';
import { fincaService } from './FincaService';

/** Orden oficial de las etapas. */
export const ETAPAS: EtapaCultivo[] = [
  'PREPARACION',
  'SIEMBRA',
  'CRECIMIENTO',
  'MANTENIMIENTO',
  'COSECHA',
  'FINALIZADA',
];

export class CultivoService {
  /** Lista los cultivos con filtros. */
  async listar(filtros: { etapa?: string; estado?: string; texto?: string }): Promise<Cultivo[]> {
    const idFinca = await fincaService.obtenerId();
    return cultivoRepository.findAll(idFinca, filtros as never);
  }

  /** Cultivos agrupados por etapa (para las pestañas del listado). */
  async resumenPorEtapa(): Promise<{ etapa: string; cantidad: number }[]> {
    const idFinca = await fincaService.obtenerId();
    return cultivoRepository.contarPorEtapa(idFinca);
  }

  /** Obtiene un cultivo por id. */
  async obtenerPorId(id: number): Promise<Cultivo> {
    const cultivo = await cultivoRepository.findById(id);

    if (!cultivo) {
      throw new AppError('Cultivo no encontrado', 404);
    }

    return cultivo;
  }

  /** Registra un cultivo nuevo. */
  async crear(datos: DatosCultivo, idUsuario: number): Promise<Cultivo> {
    const idFinca = await fincaService.obtenerId();

    const id = await cultivoRepository.create(datos, idFinca, idUsuario, idUsuario);

    return this.obtenerPorId(id);
  }

  /** Actualiza los datos de un cultivo. */
  async actualizar(id: number, datos: Partial<DatosCultivo>): Promise<Cultivo> {
    await this.obtenerPorId(id);

    await cultivoRepository.update(id, datos);

    return this.obtenerPorId(id);
  }

  /**
   * Cambia la etapa del cultivo.
   * Aquí se aplican las reglas del ciclo de vida.
   */
  async cambiarEtapa(id: number, etapa: EtapaCultivo): Promise<Cultivo> {
    const cultivo = await this.obtenerPorId(id);

    // No se puede cambiar la etapa de un cultivo cancelado
    if (cultivo.estado === 'CANCELADO') {
      throw new AppError('El cultivo está cancelado, no se puede cambiar su etapa', 409);
    }

    // Si la etapa finalizada: guardamos la fecha real y cerramos el cultivo
    if (etapa === 'FINALIZADA') {
      const hoy = new Date().toISOString().slice(0, 10);

      await cultivoRepository.cambiarEtapa(id, etapa);
      await cultivoRepository.registrarCosecha(id, hoy);
      await cultivoRepository.cambiarEstado(id, 'FINALIZADO');
    } else {
      // Si vuelve a una etapa anterior, el cultivo vuelve a estar activo
      await cultivoRepository.cambiarEtapa(id, etapa);
      await cultivoRepository.cambiarEstado(id, 'ACTIVO');
    }

    return this.obtenerPorId(id);
  }

  /** Cambia el estado del cultivo (cancelar, reactivar). */
  async cambiarEstado(id: number, estado: 'ACTIVO' | 'FINALIZADO' | 'CANCELADO'): Promise<Cultivo> {
    await this.obtenerPorId(id);

    await cultivoRepository.cambiarEstado(id, estado);

    return this.obtenerPorId(id);
  }

  /** Registra una actividad agrícola sobre un cultivo. */
  async registrarActividad(
    idCultivo: number,
    idUsuario: number,
    datos: { fecha: string; tipo: string; descripcion?: string; observaciones?: string }
  ): Promise<{ id_actividad: number }> {
    await this.obtenerPorId(idCultivo);

    const id = await cultivoRepository.createActividad(
      datos as never,
      idCultivo,
      idUsuario
    );

    return { id_actividad: id };
  }

  /** Lista las actividades de un cultivo. */
  async obtenerActividades(idCultivo: number): Promise<ActividadAgricola[]> {
    await this.obtenerPorId(idCultivo);

    return cultivoRepository.findActividades(idCultivo);
  }
}

export const cultivoService = new CultivoService();
