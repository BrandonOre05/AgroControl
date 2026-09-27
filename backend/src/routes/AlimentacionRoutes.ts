// ============================================================
// routes/AlimentacionRoutes.ts
// Endpoints de la alimentación.
//
// Todos los roles pueden registrar alimentación: es parte de su
// trabajo diario. Si se indica un producto del inventario, el stock
// se descuenta en la misma transacción.
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { alimentacionService } from '../services/AlimentacionService';
import { validar } from '../utils/validacion';
import {
  crearAlimentacionSchema,
  filtrosAlimentacionSchema,
} from '../validators/AlimentacionValidators';

const router = Router();

router.use(verificarToken);

/** GET /api/alimentacion?id_animal=&dias=30&limite=50 */
router.get('/', verificarPermiso('alimentacion', 'ver'), async (req, res, next) => {
  try {
    const filtros = validar(filtrosAlimentacionSchema, req.query);
    res.json(await alimentacionService.listar(filtros));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alimentacion
 * Registra la alimentación de un animal o de un grupo.
 */
router.post('/', verificarPermiso('alimentacion', 'registrar'), async (req, res, next) => {
  try {
    const datos = validar(crearAlimentacionSchema, req.body);

    res.status(201).json(
      await alimentacionService.registrar(datos, req.user!.id_usuario)
    );
  } catch (error) {
    next(error);
  }
});

export default router;
