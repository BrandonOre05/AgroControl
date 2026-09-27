// ============================================================
// routes/AnimalRoutes.ts
// Endpoints del módulo de animales.
//
// Reglas de permisos:
//   - Ver (listar, ficha, historial): cualquier usuario autenticado.
//   - Crear / modificar / cambiar estado: ADMIN y ENCARGADO.
//   - El TRABAJADOR solo registra; no modifica fichas.
// ============================================================

import { Router } from 'express';
import { verificarRol, verificarToken } from '../middlewares/AuthMiddleware';
import { animalService } from '../services/AnimalService';
import { AppError } from '../utils/AppError';
import { idEntero, validar } from '../utils/validacion';
import {
  actualizarAnimalSchema,
  crearAnimalSchema,
  estadoAnimalSchema,
  filtrosAnimalSchema,
} from '../validators/AnimalValidators';

const router = Router();

// Todas las rutas de este módulo exigen token
router.use(verificarToken);

/** GET /api/animales — lista con filtros: ?estado_indice=&estado_animal=&especie=&texto= */
router.get('/', async (req, res, next) => {
  try {
    const filtros = validar(filtrosAnimalSchema, req.query);
    res.json(await animalService.listar(filtros));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/animales/recalcular-indices
 * Recalcula el Índice de Estado de todos los animales activos.
 * Se coloca antes de /:id para que no lo confunda con un id.
 */
router.post('/recalcular-indices', verificarRol('ADMIN', 'ENCARGADO'), async (_req, res, next) => {
  try {
    res.json(await animalService.recalcularIndices());
  } catch (error) {
    next(error);
  }
});

/** GET /api/animales/:id — ficha del animal. */
router.get('/:id', async (req, res, next) => {
  try {
    res.json(await animalService.obtenerPorId(idEntero(req.params.id, 'animal')));
  } catch (error) {
    next(error);
  }
});

/** GET /api/animales/:id/historial — historial cronológico. */
router.get('/:id/historial', async (req, res, next) => {
  try {
    res.json(await animalService.obtenerHistorial(idEntero(req.params.id, 'animal')));
  } catch (error) {
    next(error);
  }
});

/** POST /api/animales — registra un animal. */
router.post('/', verificarRol('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const datos = validar(crearAnimalSchema, req.body);
    const animal = await animalService.crear(datos, req.user!.id_usuario);
    res.status(201).json(animal);
  } catch (error) {
    next(error);
  }
});

/** PUT /api/animales/:id — actualiza la ficha. */
router.put('/:id', verificarRol('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const datos = validar(actualizarAnimalSchema, req.body);
    res.json(await animalService.actualizar(idEntero(req.params.id, 'animal'), datos));
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/animales/:id/estado — cambia el estado (VENDIDO, FALECIDO...). */
router.patch('/:id/estado', verificarRol('ADMIN', 'ENCARGADO'), async (req, res, next) => {
  try {
    const { estado } = validar(estadoAnimalSchema, req.body);
    res.json(await animalService.cambiarEstado(idEntero(req.params.id, 'animal'), estado));
  } catch (error) {
    next(error);
  }
});

export default router;
