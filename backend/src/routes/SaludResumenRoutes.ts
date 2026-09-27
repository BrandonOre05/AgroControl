// ============================================================
// routes/SaludResumenRoutes.ts
// Resumen sanitario de TODA la finca.
//
// ¿Por qué está solo en su propio archivo?
// SaludRoutes maneja rutas que pertenecen a UN animal
// (/api/animales/4/vacunas), pero este resumen es de la finca
// completa. Antes todo estaba en SaludRoutes y ese archivo se
// montaba dos veces ("/api/animales" y "/api/salud"), lo que
// dejaba rutas raras vivas como GET /api/animales/resumen, que
// chocaba con GET /api/animales/:id.
//
// Separarlo deja la API limpia:
//   /api/animales/:id/...  -> SaludRoutes       (sub-recurso del animal)
//   /api/salud/resumen     -> este archivo      (resumen de la finca)
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { saludService } from '../services/SaludService';

const router = Router();

router.use(verificarToken);

/** GET /api/salud/resumen?dias=30 */
router.get('/resumen', async (req, res, next) => {
  try {
    // req.query siempre trae texto, por eso usamos Number()
    const dias = req.query.dias ? Number(req.query.dias) : 30;

    if (Number.isNaN(dias)) {
      return res.status(400).json({ mensaje: 'El parámetro "dias" debe ser un número' });
    }

    res.json(await saludService.resumenGeneral(dias));
  } catch (error) {
    next(error);
  }
});

export default router;
