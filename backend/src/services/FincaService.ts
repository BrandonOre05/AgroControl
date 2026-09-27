// ============================================================
// services/FincaService.ts
// Reglas de negocio de la finca.
//
// En la primera versión se maneja UNA sola finca: por eso los
// métodos no reciben id y usan siempre la finca principal.
// ============================================================

import { DatosFinca, Finca } from '../models/Finca';
import { fincaRepository } from '../repositories/FincaRepository';
import { AppError } from '../utils/AppError';

export class FincaService {
  /** Devuelve la finca principal. Lanza 404 si aún no se ha creado. */
  async obtener(): Promise<Finca> {
    const finca = await fincaRepository.obtenerPrincipal();

    if (!finca) {
      throw new AppError(
        'No hay una finca registrada. Un administrador debe crearla primero.',
        404
      );
    }

    return finca;
  }

  /** Devuelve solo el id de la finca (lo usan otros módulos). */
  async obtenerId(): Promise<number> {
    const finca = await this.obtener();
    return finca.id_finca;
  }

  /** Crea la finca. Solo se permite una. */
  async crear(datos: DatosFinca): Promise<Finca> {
    const existentes = await fincaRepository.contar();

    if (existentes > 0) {
      throw new AppError('Ya existe una finca registrada. Usa la actualización.', 409);
    }

    const id = await fincaRepository.create(datos);
    const finca = await fincaRepository.obtenerPorId(id);

    return finca!;
  }

  /** Actualiza los datos de la finca. */
  async actualizar(datos: Partial<DatosFinca>): Promise<Finca> {
    const finca = await this.obtener();

    await fincaRepository.actualizar(finca.id_finca, datos);

    const actualizada = await fincaRepository.obtenerPorId(finca.id_finca);
    return actualizada!;
  }
}

export const fincaService = new FincaService();
