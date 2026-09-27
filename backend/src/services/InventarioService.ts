// ============================================================
// services/InventarioService.ts
// Reglas de negocio del inventario.
// ============================================================

import {
  DatosProducto,
  FiltrosProducto,
  MovimientoInventario,
  Producto,
  TipoMovimiento,
} from '../models/Inventario';
import { inventarioRepository } from '../repositories/InventarioRepository';
import { AppError } from '../utils/AppError';
import { fincaService } from './FincaService';

export class InventarioService {
  /** Lista los productos con filtros. */
  async listar(filtros: FiltrosProducto): Promise<Producto[]> {
    const idFinca = await fincaService.obtenerId();
    return inventarioRepository.findAll(idFinca, filtros);
  }

  /** Resumen para el panel de inventario. */
  async resumen() {
    const idFinca = await fincaService.obtenerId();
    return inventarioRepository.resumen(idFinca);
  }

  /** Obtiene un producto por id. */
  async obtenerPorId(id: number): Promise<Producto> {
    const producto = await inventarioRepository.findById(id);

    if (!producto) {
      throw new AppError('Producto no encontrado', 404);
    }

    return producto;
  }

  /** Registra un producto nuevo. */
  async crear(datos: DatosProducto, idUsuario: number): Promise<Producto> {
    const idFinca = await fincaService.obtenerId();

    const id = await inventarioRepository.create(datos, idFinca, idUsuario);

    // Si la cantidad inicial es mayor que cero, lo registramos como ENTRADA
    // para que el historial de movimientos quede completo desde el inicio.
    if (datos.stock_actual > 0) {
      await inventarioRepository.registrarMovimiento(
        id,
        { tipo: 'ENTRADA', cantidad: datos.stock_actual, motivo: 'Carga inicial' },
        idUsuario
      );
    }

    return this.obtenerPorId(id);
  }

  /** Actualiza los datos del producto. */
  async actualizar(id: number, datos: Partial<DatosProducto>): Promise<Producto> {
    await this.obtenerPorId(id);

    await inventarioRepository.update(id, datos);

    return this.obtenerPorId(id);
  }

  /**
   * Registra una entrada, salida o ajuste de stock.
   * El stock se actualiza en la misma transacción del movimiento.
   */
  async registrarMovimiento(
    id: number,
    idUsuario: number,
    datos: { tipo: TipoMovimiento; cantidad: number; motivo?: string; observaciones?: string }
  ): Promise<{ producto: Producto; stock_nuevo: number }> {
    await this.obtenerPorId(id);

    try {
      const stockNuevo = await inventarioRepository.registrarMovimiento(id, datos, idUsuario);

      return { producto: await this.obtenerPorId(id), stock_nuevo: stockNuevo };
    } catch (error) {
      const codigo = (error as Error).message;

      // Errores que lanza la transacción del repositorio
      if (codigo === 'PRODUCTO_NO_ENCONTRADO') {
        throw new AppError('Producto no encontrado', 404);
      }

      if (codigo === 'STOCK_INSUFICIENTE') {
        throw new AppError(
          'No hay suficiente inventario para realizar esta salida',
          409
        );
      }

      throw error;
    }
  }

  /** Movimientos de un producto. */
  async movimientos(id: number): Promise<MovimientoInventario[]> {
    await this.obtenerPorId(id);

    return inventarioRepository.movimientosDe(id);
  }

  /** Recalcula el estado de todos los productos (útil tras vencimientos). */
  async recalcularEstados(): Promise<{ actualizados: number }> {
    const idFinca = await fincaService.obtenerId();

    return { actualizados: await inventarioRepository.recalcularEstados(idFinca) };
  }
}

export const inventarioService = new InventarioService();
