// ============================================================
// routes/ReporteRoutes.ts
// Endpoints de reportes.
//
// GET /api/reportes                  → lista los reportes disponibles
// GET /api/reportes/:tipo            → datos en JSON
// GET /api/reportes/:tipo/csv        → descarga el archivo CSV
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { reporteService, TIPOS_REPORTE } from '../services/ReporteService';

const router = Router();

router.use(verificarToken);

/** Lista de reportes disponibles (para pintar las tarjetas). */
router.get('/', verificarPermiso('reportes', 'ver'), (_req, res) => {
  res.json({
    reportes: [
      { tipo: 'produccion', titulo: 'Reporte de producción', icono: 'produccion' },
      { tipo: 'animales', titulo: 'Reporte de animales', icono: 'animales' },
      { tipo: 'actividades', titulo: 'Reporte de actividades', icono: 'actividades' },
      { tipo: 'cultivos', titulo: 'Reporte de cultivos', icono: 'cultivos' },
      { tipo: 'inventario', titulo: 'Reporte de inventario', icono: 'inventario' },
    ].filter((r) => (TIPOS_REPORTE as readonly string[]).includes(r.tipo)),
  });
});

/** Reporte en JSON. */
router.get('/:tipo', verificarPermiso('reportes', 'ver'), async (req, res, next) => {
  try {
    res.json(await reporteService.generar(req.params.tipo));
  } catch (error) {
    next(error);
  }
});

/**
 * Reporte en CSV (se descarga como archivo).
 * Se manda como texto plano para que el navegador lo descargue.
 */
router.get(
  '/:tipo/csv',
  verificarPermiso('reportes', 'exportar'),
  async (req, res, next) => {
    try {
      const { nombreArchivo, contenido } = await reporteService.generarCsv(req.params.tipo);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

      res.send(contenido);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
