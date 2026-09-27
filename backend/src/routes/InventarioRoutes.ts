// ============================================================
// routes/InventarioRoutes.ts
// Endpoints del inventario y sus movimientos.
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { inventarioService } from '../services/InventarioService';
import { idEntero, validar } from '../utils/validacion';
import {
  actualizarProductoSchema,
  crearProductoSchema,
  filtrosProductoSchema,
  movimientoSchema,
} from '../validators/InventarioValidators';

const router = Router();

router.use(verificarToken);

/** GET /api/inventario?categoria=&estado=&texto= */
router.get('/', verificarPermiso('inventario', 'ver'), async (req, res, next) => {
  try {
    const filtros = validar(filtrosProductoSchema, req.query);
    res.json(await inventarioService.listar(filtros));
  } catch (error) {
    next(error);
  }
});

/** GET /api/inventario/resumen — KPIs de la pantalla. */
router.get('/resumen', verificarPermiso('inventario', 'ver'), async (_req, res, next) => {
  try {
    res.json(await inventarioService.resumen());
  } catch (error) {
    next(error);
  }
});

/** GET /api/inventario/:id */
router.get('/:id', verificarPermiso('inventario', 'ver'), async (req, res, next) => {
  try {
    res.json(await inventarioService.obtenerPorId(idEntero(req.params.id, 'producto')));
  } catch (error) {
    next(error);
  }
});

/** GET /api/inventario/:id/movimientos */
router.get('/:id/movimientos', verificarPermiso('inventario', 'ver'), async (req, res, next) => {
  try {
    res.json(await inventarioService.movimientos(idEntero(req.params.id, 'producto')));
  } catch (error) {
    next(error);
  }
});

/** POST /api/inventario */
router.post('/', verificarPermiso('inventario', 'crear'), async (req, res, next) => {
  try {
    const datos = validar(crearProductoSchema, req.body);
    res.status(201).json(await inventarioService.crear(datos, req.user!.id_usuario));
  } catch (error) {
    next(error);
  }
});

/** PUT /api/inventario/:id */
router.put('/:id', verificarPermiso('inventario', 'editar'), async (req, res, next) => {
  try {
    const datos = validar(actualizarProductoSchema, req.body);
    res.json(await inventarioService.actualizar(idEntero(req.params.id, 'producto'), datos));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inventario/:id/movimientos
 * Registra una ENTRADA, SALIDA o AJUSTE de stock.
 */
router.post(
  '/:id/movimientos',
  verificarPermiso('inventario', 'registrar_movimiento'),
  async (req, res, next) => {
    try {
      const datos = validar(movimientoSchema, req.body);
      res.status(201).json(
        await inventarioService.registrarMovimiento(
          idEntero(req.params.id, 'producto'),
          req.user!.id_usuario,
          datos
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

/** POST /api/inventario/recalcular-estados */
router.post(
  '/recalcular-estados',
  verificarPermiso('inventario', 'editar'),
  async (_req, res, next) => {
    try {
      res.json(await inventarioService.recalcularEstados());
    } catch (error) {
      next(error);
    }
  }
);

export default router;
