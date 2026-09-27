// ============================================================
// routes/AlertaRoutes.ts
// Endpoints del sistema de alertas.
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { alertaService } from '../services/AlertaService';
import { idEntero, validar } from '../utils/validacion';
import { filtrosAlertaSchema, resolverAlertaSchema } from '../validators/AlertaValidators';

const router = Router();

router.use(verificarToken);

/** GET /api/alertas?estado=ACTIVA&severidad=CRITICA&tipo=VACUNA_PROXIMA */
router.get('/', verificarPermiso('alertas', 'ver'), async (req, res, next) => {
  try {
    const filtros = validar(filtrosAlertaSchema, req.query);
    res.json(await alertaService.listar(filtros));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alertas/sincronizar
 * Fuerza el recálculo de todas las alertas.
 * (El dashboard ya lo hace solo al abrirse.)
 */
router.post('/sincronizar', verificarPermiso('alertas', 'regenerar'), async (_req, res, next) => {
  try {
    res.json(await alertaService.sincronizar());
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/alertas/:id — resuelve o ignora una alerta. */
router.patch('/:id', verificarPermiso('alertas', 'resolver'), async (req, res, next) => {
  try {
    const { estado } = validar(resolverAlertaSchema, req.body);
    res.json(await alertaService.cambiarEstado(idEntero(req.params.id, 'alerta'), estado, req.user!.id_usuario));
  } catch (error) {
    next(error);
  }
});

export default router;
