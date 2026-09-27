// ============================================================
// routes/FincaRoutes.ts
// Endpoints de la finca.
//
// En esta versión hay UNA sola finca, por eso las rutas no
// llevan id: GET /api/finca, PUT /api/finca...
// ============================================================

import { Router } from 'express';
import { verificarRol, verificarToken } from '../middlewares/AuthMiddleware';
import { fincaService } from '../services/FincaService';
import { validar } from '../utils/validacion';
import { crearFincaSchema } from '../validators/FincaValidators';

const router = Router();

/** GET /api/finca — datos de la finca (cualquier usuario autenticado). */
router.get('/', verificarToken, async (_req, res, next) => {
  try {
    res.json(await fincaService.obtener());
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/finca — crea la finca.
 * Solo ADMIN (y solo puede existir una).
 */
router.post('/', verificarToken, verificarRol('ADMIN'), async (req, res, next) => {
  try {
    const datos = validar(crearFincaSchema, req.body);
    res.status(201).json(await fincaService.crear(datos));
  } catch (error) {
    next(error);
  }
});

/** PUT /api/finca — actualiza los datos (ADMIN y ENCARGADO). */
router.put('/', verificarToken, verificarRol('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const datos = validar(crearFincaSchema.partial(), req.body);
    res.json(await fincaService.actualizar(datos));
  } catch (error) {
    next(error);
  }
});

export default router;
