// ============================================================
// routes/ActividadRoutes.ts
// Endpoints de las tareas del personal.
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { actividadService } from '../services/ActividadService';
import { idEntero, validar } from '../utils/validacion';
import {
  actualizarActividadSchema,
  crearActividadSchema,
  estadoActividadSchema,
  filtrosActividadSchema,
} from '../validators/ActividadValidators';

const router = Router();

router.use(verificarToken);

/** GET /api/actividades?estado=&tipo=&responsable= */
router.get('/', verificarPermiso('actividades', 'ver'), async (req, res, next) => {
  try {
    const filtros = validar(filtrosActividadSchema, req.query);
    res.json(await actividadService.listar(filtros));
  } catch (error) {
    next(error);
  }
});

/** GET /api/actividades/resumen — contadores por estado. */
router.get('/resumen', verificarPermiso('actividades', 'ver'), async (_req, res, next) => {
  try {
    res.json(await actividadService.resumen());
  } catch (error) {
    next(error);
  }
});

/** GET /api/actividades/:id */
router.get('/:id', verificarPermiso('actividades', 'ver'), async (req, res, next) => {
  try {
    res.json(await actividadService.obtenerPorId(idEntero(req.params.id, 'actividad')));
  } catch (error) {
    next(error);
  }
});

/** POST /api/actividades */
router.post('/', verificarPermiso('actividades', 'crear'), async (req, res, next) => {
  try {
    const datos = validar(crearActividadSchema, req.body);
    res.status(201).json(await actividadService.crear(datos));
  } catch (error) {
    next(error);
  }
});

/** PUT /api/actividades/:id */
router.put('/:id', verificarPermiso('actividades', 'editar'), async (req, res, next) => {
  try {
    const datos = validar(actualizarActividadSchema, req.body);
    res.json(await actividadService.actualizar(idEntero(req.params.id, 'actividad'), datos));
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/actividades/:id/estado
 * Cualquier usuario puede marcar avance (permiso registrar_avance).
 */
router.patch(
  '/:id/estado',
  verificarPermiso('actividades', 'registrar_avance'),
  async (req, res, next) => {
    try {
      const { estado } = validar(estadoActividadSchema, req.body);
      res.json(await actividadService.cambiarEstado(idEntero(req.params.id, 'actividad'), estado));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
