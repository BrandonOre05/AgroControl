// ============================================================
// routes/SaludRoutes.ts
// Endpoints de los eventos de salud de UN animal.
//
// Este archivo se monta UNA sola vez, en "/api/animales", porque
// sus rutas son un sub-recurso del animal: /api/animales/4/vacunas.
// El resumen de toda la finca NO vive aquí: está en
// SaludResumenRoutes.ts (montado en "/api/salud").
//
// Permisos:
//   - ADMIN y ENCARGADO: registrar vacunas, tratamientos, controles
//     e incidentes.
//   - También el TRABAJADOR: pesajes y controles básicos (medir y
//     revisar es parte de su trabajo diario).
// ============================================================

import { Router } from 'express';
import { verificarRol, verificarToken } from '../middlewares/AuthMiddleware';
import { saludService } from '../services/SaludService';
import { idEntero, validar } from '../utils/validacion';
import {
  controlSchema,
  incidenteSchema,
  pesajeSchema,
  tratamientoSchema,
  vacunaSchema,
} from '../validators/SaludValidators';

const router = Router();

// Todas estas rutas requieren token
router.use(verificarToken);

/** POST /api/animales/:id/vacunas */
router.post('/:id/vacunas', verificarRol('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const datos = validar(vacunaSchema, req.body);
    const resultado = await saludService.registrarVacuna(
      idEntero(req.params.id, 'animal'),
      req.user!.id_usuario,
      datos
    );
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
});

/** POST /api/animales/:id/tratamientos */
router.post('/:id/tratamientos', verificarRol('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const datos = validar(tratamientoSchema, req.body);
    const resultado = await saludService.registrarTratamiento(
      idEntero(req.params.id, 'animal'),
      req.user!.id_usuario,
      datos
    );
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
});

/** POST /api/animales/:id/controles (también puede hacerlo un TRABAJADOR) */
router.post(
  '/:id/controles',
  verificarRol('ADMIN', 'ENCARGADO', 'TRABAJADOR'),
  async (req, res, next) => {
    try {
      const datos = validar(controlSchema, req.body);
      const resultado = await saludService.registrarControl(
        idEntero(req.params.id, 'animal'),
        req.user!.id_usuario,
        datos
      );
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  }
);

/** POST /api/animales/:id/pesajes (también puede hacerlo un TRABAJADOR) */
router.post('/:id/pesajes', verificarRol('ADMIN', 'ENCARGADO', 'TRABAJADOR'), async (req, res, next) => {
  try {
    const datos = validar(pesajeSchema, req.body);
    const resultado = await saludService.registrarPesaje(
      idEntero(req.params.id, 'animal'),
      req.user!.id_usuario,
      datos
    );
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
});

/** POST /api/animales/:id/incidentes */
router.post('/:id/incidentes', verificarRol('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const datos = validar(incidenteSchema, req.body);
    const resultado = await saludService.registrarIncidente(
      idEntero(req.params.id, 'animal'),
      req.user!.id_usuario,
      datos
    );
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
});

/** GET /api/animales/:id/proximos?dias=30 — eventos programados por vencer. */
router.get('/:id/proximos', async (req, res, next) => {
  try {
    // req.query siempre trae texto, por eso usamos Number()
    const dias = req.query.dias ? Number(req.query.dias) : 30;

    if (Number.isNaN(dias)) {
      return res.status(400).json({ mensaje: 'El parámetro "dias" debe ser un número' });
    }

    res.json(await saludService.proximosEventos(idEntero(req.params.id, 'animal'), dias));
  } catch (error) {
    next(error);
  }
});

export default router;
