// ============================================================
// routes/DashboardRoutes.ts
// Endpoint del panel de control (resumen de la finca).
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { dashboardService } from '../services/DashboardService';

const router = Router();

router.use(verificarToken);

/**
 * GET /api/dashboard
 * Devuelve todos los indicadores del panel en un solo JSON.
 * Antes de armar el resumen sincroniza las alertas.
 */
router.get('/', verificarPermiso('dashboard', 'ver'), async (_req, res, next) => {
  try {
    res.json(await dashboardService.obtenerResumen());
  } catch (error) {
    next(error);
  }
});

export default router;
