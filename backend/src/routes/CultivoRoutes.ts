// ============================================================
// routes/CultivoRoutes.ts
// Endpoints del módulo de cultivos y actividades agrícolas.
//
// Permisos (matriz de permisos):
//   ver                   -> todos los roles
//   crear / editar        -> ADMIN y ENCARGADO
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { cultivoService } from '../services/CultivoService';
import { idEntero, validar } from '../utils/validacion';
import {
  actividadAgricolaSchema,
  actualizarCultivoSchema,
  crearCultivoSchema,
  etapaCultivoSchema,
  estadoCultivoSchema,
  filtrosCultivoSchema,
} from '../validators/CultivoValidators';

const router = Router();

router.use(verificarToken);

/** GET /api/cultivos?etapa=&estado=&texto= */
router.get('/', verificarPermiso('cultivos', 'ver'), async (req, res, next) => {
  try {
    const filtros = validar(filtrosCultivoSchema, req.query);
    res.json(await cultivoService.listar(filtros));
  } catch (error) {
    next(error);
  }
});

/** GET /api/cultivos/resumen — cantidad por etapa (pestañas del listado). */
router.get('/resumen', verificarPermiso('cultivos', 'ver'), async (_req, res, next) => {
  try {
    res.json(await cultivoService.resumenPorEtapa());
  } catch (error) {
    next(error);
  }
});

/** GET /api/cultivos/:id */
router.get('/:id', verificarPermiso('cultivos', 'ver'), async (req, res, next) => {
  try {
    res.json(await cultivoService.obtenerPorId(idEntero(req.params.id, 'cultivo')));
  } catch (error) {
    next(error);
  }
});

/** GET /api/cultivos/:id/actividades */
router.get('/:id/actividades', verificarPermiso('cultivos', 'ver'), async (req, res, next) => {
  try {
    res.json(await cultivoService.obtenerActividades(idEntero(req.params.id, 'cultivo')));
  } catch (error) {
    next(error);
  }
});

/** POST /api/cultivos */
router.post('/', verificarPermiso('cultivos', 'crear'), async (req, res, next) => {
  try {
    const datos = validar(crearCultivoSchema, req.body);
    res.status(201).json(await cultivoService.crear(datos, req.user!.id_usuario));
  } catch (error) {
    next(error);
  }
});

/** PUT /api/cultivos/:id */
router.put('/:id', verificarPermiso('cultivos', 'editar'), async (req, res, next) => {
  try {
    const datos = validar(actualizarCultivoSchema, req.body);
    res.json(await cultivoService.actualizar(idEntero(req.params.id, 'cultivo'), datos));
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/cultivos/:id/etapa — avanza o retrocede en el ciclo. */
router.patch('/:id/etapa', verificarPermiso('cultivos', 'editar'), async (req, res, next) => {
  try {
    const { etapa } = validar(etapaCultivoSchema, req.body);
    res.json(await cultivoService.cambiarEtapa(idEntero(req.params.id, 'cultivo'), etapa));
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/cultivos/:id/estado — cancelar o reactivar. */
router.patch('/:id/estado', verificarPermiso('cultivos', 'editar'), async (req, res, next) => {
  try {
    const { estado } = validar(estadoCultivoSchema, req.body);
    res.json(await cultivoService.cambiarEstado(idEntero(req.params.id, 'cultivo'), estado));
  } catch (error) {
    next(error);
  }
});

/** POST /api/cultivos/:id/actividades — registrar una actividad. */
router.post(
  '/:id/actividades',
  verificarPermiso('cultivos', 'crear'),
  async (req, res, next) => {
    try {
      const datos = validar(actividadAgricolaSchema, req.body);
      res.status(201).json(
        await cultivoService.registrarActividad(
          idEntero(req.params.id, 'cultivo'),
          req.user!.id_usuario,
          datos
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
