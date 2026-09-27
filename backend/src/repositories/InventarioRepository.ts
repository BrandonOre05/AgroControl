// ============================================================
// repositories/InventarioRepository.ts
// Consultas SQL de Producto y MovimientoInventario.
//
// IMPORTANTE: el stock NUNCA se cambia por separado. Toda modificación
// pasa por `registrarMovimiento`, que en UNA MISMA TRANSACCIÓN inserta
// el movimiento y actualiza el stock. Así el inventario nunca queda
// descuadrado.
// ============================================================

import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import {
  CategoriaProducto,
  DatosProducto,
  EstadoProducto,
  FiltrosProducto,
  MovimientoInventario,
  Producto,
  TipoMovimiento,
} from '../models/Inventario';

type ProductoRow = Producto & RowDataPacket;
type MovimientoRow = MovimientoInventario & RowDataPacket;
type ClienteDB = Pool | PoolConnection;

const COLUMNAS_PERMITIDAS = [
  'nombre',
  'unidad',
  'stock_minimo',
  'fecha_vencimiento',
  'observaciones',
] as const;

export class InventarioRepository {
  /** Lista productos con filtros opcionales. */
  async findAll(idFinca: number, filtros: FiltrosProducto = {}): Promise<ProductoRow[]> {
    const condiciones: string[] = ['id_finca = ?'];
    const valores: unknown[] = [idFinca];

    if (filtros.categoria) {
      condiciones.push('categoria = ?');
      valores.push(filtros.categoria);
    }

    if (filtros.estado) {
      condiciones.push('estado = ?');
      valores.push(filtros.estado);
    }

    if (filtros.texto) {
      condiciones.push('nombre LIKE ?');
      valores.push(`%${filtros.texto}%`);
    }

    const [filas] = await pool.query<ProductoRow[]>(
      `SELECT * FROM Producto WHERE ${condiciones.join(' AND ')} ORDER BY nombre ASC`,
      valores
    );

    return filas;
  }

  /** Busca un producto por id. */
  async findById(id: number): Promise<ProductoRow | null> {
    const [filas] = await pool.query<ProductoRow[]>('SELECT * FROM Producto WHERE id_producto = ?', [
      id,
    ]);

    return filas[0] ?? null;
  }

  /** Inserta un producto. */
  async create(datos: DatosProducto, idFinca: number, creadoPor?: number): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Producto (id_finca, nombre, categoria, unidad, stock_actual, stock_minimo,
                             fecha_vencimiento, observaciones, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idFinca,
        datos.nombre,
        datos.categoria,
        datos.unidad,
        datos.stock_actual,
        datos.stock_minimo ?? 0,
        datos.fecha_vencimiento ?? null,
        datos.observaciones ?? null,
        creadoPor ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Actualiza datos del producto (sin tocar el stock). */
  async update(id: number, datos: Partial<DatosProducto>): Promise<void> {
    const campos = Object.keys(datos).filter((campo) =>
      (COLUMNAS_PERMITIDAS as readonly string[]).includes(campo)
    );

    if (campos.length === 0) return;

    const setClause = campos.map((campo) => `${campo} = ?`).join(', ');
    const valores = campos.map((campo) => (datos as Record<string, unknown>)[campo]);

    await pool.query(`UPDATE Producto SET ${setClause} WHERE id_producto = ?`, [...valores, id]);
  }

  /**
   * Registra un movimiento y actualiza el stock en la MISMA transacción.
   * - ENTRADA: suma stock
   * - SALIDA: resta stock
   * - AJUSTE: fija el stock al valor indicado
   * Devuelve el stock resultante.
   */
  async registrarMovimiento(
    idProducto: number,
    datos: { tipo: TipoMovimiento; cantidad: number; motivo?: string; observaciones?: string },
    responsable?: number
  ): Promise<number> {
    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      const stockNuevo = await aplicarMovimiento(
        conexion,
        idProducto,
        datos.tipo,
        datos.cantidad,
        datos.motivo ?? '',
        responsable,
        datos.observaciones
      );

      await conexion.commit();

      return stockNuevo;
    } catch (error) {
      await conexion.rollback();
      throw error;
    } finally {
      conexion.release();
    }
  }

  /** Calcula el estado del producto a partir de su stock. */
  private calcularEstado(
    stock: number,
    stockMinimo: number,
    fechaVencimiento: string | null
  ): EstadoProducto {
    // Si ya venció la fecha, está vencido aunque hayaExistencia
    if (fechaVencimiento && new Date(fechaVencimiento) < new Date()) {
      return 'VENCIDO';
    }

    if (stock <= 0) return 'AGOTADO';
    if (stock <= stockMinimo) return 'BAJO';

    return 'DISPONIBLE';
  }

  /** Recalcula el estado de todos los productos (por ejemplo, tras pasar la fecha). */
  async recalcularEstados(idFinca: number): Promise<number> {
    const productos = await this.findAll(idFinca);
    let cambios = 0;

    for (const producto of productos) {
      const estado = this.calcularEstado(
        Number(producto.stock_actual),
        Number(producto.stock_minimo),
        producto.fecha_vencimiento
      );

      if (estado !== producto.estado) {
        await pool.query('UPDATE Producto SET estado = ? WHERE id_producto = ?', [estado, producto.id_producto]);
        cambios++;
      }
    }

    return cambios;
  }

  /** Lista los movimientos de un producto. */
  async movimientosDe(idProducto: number): Promise<MovimientoRow[]> {
    const [filas] = await pool.query<MovimientoRow[]>(
      `SELECT m.*, p.nombre AS nombre_producto
       FROM MovimientoInventario m
       JOIN Producto p ON p.id_producto = m.id_producto
       WHERE m.id_producto = ?
       ORDER BY m.fecha DESC`,
      [idProducto]
    );

    return filas;
  }

  /** Resumen para el panel: totales, categorías y stock bajo. */
  async resumen(idFinca: number) {
    const [totales] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_productos,
              SUM(CASE WHEN estado = 'BAJO' THEN 1 ELSE 0 END) AS stock_bajo,
              SUM(CASE WHEN estado = 'AGOTADO' THEN 1 ELSE 0 END) AS agotados,
              SUM(CASE WHEN estado = 'VENCIDO' THEN 1 ELSE 0 END) AS vencidos
       FROM Producto WHERE id_finca = ?`,
      [idFinca]
    );

    const [categorias] = await pool.query<RowDataPacket[]>(
      `SELECT categoria, COUNT(*) AS cantidad
       FROM Producto WHERE id_finca = ?
       GROUP BY categoria`,
      [idFinca]
    );

    return {
      total_productos: Number(totales[0]?.total_productos ?? 0),
      stock_bajo: Number(totales[0]?.stock_bajo ?? 0),
      agotados: Number(totales[0]?.agotados ?? 0),
      vencidos: Number(totales[0]?.vencidos ?? 0),
      por_categoria: categorias.map((c) => ({
        etiqueta: c.categoria as CategoriaProducto,
        cantidad: Number(c.cantidad),
      })),
    };
  }
}

export const inventarioRepository = new InventarioRepository();

/**
 * Aplica un movimiento de stock DENTRO de una transacción ya abierta.
 *
 * La usan dos módulos:
 *  - el propio inventario (que abre y cierra su transacción)
 *  - la alimentación (que descuenta el alimento en la misma
 *    transacción en que guarda el registro de alimentación)
 *
 * Lanza PRODUCTO_NO_ENCONTRADO o STOCK_INSUFICIENTE si algo falla.
 */
export async function aplicarMovimiento(
  conexion: PoolConnection,
  idProducto: number,
  tipo: TipoMovimiento,
  cantidad: number,
  motivo: string,
  responsable?: number,
  observaciones?: string
): Promise<number> {
  // FOR UPDATE bloquea la fila mientras working con ella: así dos
  // personas no pueden descontar el mismo stock a la vez.
  const [filas] = await conexion.query<ProductoRow[]>(
    'SELECT * FROM Producto WHERE id_producto = ? FOR UPDATE',
    [idProducto]
  );

  const producto = filas[0];

  if (!producto) {
    throw new Error('PRODUCTO_NO_ENCONTRADO');
  }

  let stockNuevo: number;

  if (tipo === 'ENTRADA') {
    stockNuevo = Number(producto.stock_actual) + cantidad;
  } else if (tipo === 'SALIDA') {
    stockNuevo = Number(producto.stock_actual) - cantidad;
  } else {
    stockNuevo = cantidad; // AJUSTE
  }

  if (stockNuevo < 0) {
    throw new Error('STOCK_INSUFICIENTE');
  }

  // El estado depende del nuevo stock (y de si el producto ya venció)
  const estado = calcularEstadoProducto(
    stockNuevo,
    Number(producto.stock_minimo),
    producto.fecha_vencimiento
  );

  await conexion.query(
    `INSERT INTO MovimientoInventario (id_producto, tipo, cantidad, motivo, responsable, observaciones)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idProducto, tipo, cantidad, motivo || null, responsable ?? null, observaciones ?? null]
  );

  await conexion.query('UPDATE Producto SET stock_actual = ?, estado = ? WHERE id_producto = ?', [
    stockNuevo,
    estado,
    idProducto,
  ]);

  return stockNuevo;
}

/** Regla de estado de un producto según su stock y vencimiento. */
export function calcularEstadoProducto(
  stock: number,
  stockMinimo: number,
  fechaVencimiento: string | null
): EstadoProducto {
  if (fechaVencimiento && new Date(fechaVencimiento) < new Date()) {
    return 'VENCIDO';
  }

  if (stock <= 0) return 'AGOTADO';
  if (stock <= stockMinimo) return 'BAJO';

  return 'DISPONIBLE';
}
