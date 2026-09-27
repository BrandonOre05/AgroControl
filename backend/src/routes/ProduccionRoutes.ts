// ============================================================
// routes/ProduccionRoutes.ts
// Endpoints de producción ganadera y agrícola.
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { produccionService } from '../services/ProduccionService';
import { validar } from '../utils/validacion';
import {
  filtrosProduccionSchema,
  produccionAgricolaSchema,
  produccionGanaderaSchema,
} from '../validators/ProduccionValidators';

const router = Router();

router.use(verificarToken);

/** GET /api/produccion/resumen?dias=30 — tarjetas, gráfica y ranking. */
router.get('/resumen', verificarPermiso('produccion', 'ver'), async (req, res, next) => {
  try {
    const dias = Number(req.query.dias ?? 30);
    res.json(await produccionService.resumen(Number.isNaN(dias) ? 30 : dias));
  } catch (error) {
    next(error);
  }
});

/** GET /api/produccion/ganadera?tipo=&id_animal=&dias= */
router.get('/ganadera', verificarPermiso('produccion', 'ver'), async (req, res, next) => {
  try {
    const filtros = validar(filtrosProduccionSchema, req.query);
    res.json(await produccionService.listarGanadera(filtros));
  } catch (error) {
    next(error);
  }
});

/** POST /api/produccion/ganadera */
router.post('/ganadera', verificarPermiso('produccion', 'registrar'), async (req, res, next) => {
  try {
    const datos = validar(produccionGanaderaSchema, req.body);
    res.status(201).json(
      await produccionService.registrarGanadera(datos, req.user!.id_usuario)
    );
  } catch (error) {
    next(error);
  }
});

/** GET /api/produccion/agricola?dias= */
router.get('/agricola', verificarPermiso('produccion', 'ver'), async (req, res, next) => {
  try {
    const dias = req.query.dias ? Number(req.query.dias) : undefined;
    res.json(await produccionService.listarAgricola(dias));
  } catch (error) {
    next(error);
  }
});

/** POST /api/produccion/agricola */
router.post('/agricola', verificarPermiso('produccion', 'registrar'), async (req, res, next) => {
  try {
    const datos = validar(produccionAgricolaSchema, req.body);
    res.status(201).json(
      await produccionService.registrarAgricola(datos, req.user!.id_usuario)
    );
  } catch (error) {
    next(error);
  }
});

export default router;
