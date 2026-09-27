// ============================================================
// routes/UsuarioRoutes.ts
// CRUD completo de usuarios.
//
// TODAS estas rutas exigen el permiso "usuarios.*", que en la
// matriz de permisos solo tiene el ADMIN. Un ENCARGADO o un
// TRABAJADOR que intente entrar recibirá 403.
// ============================================================

import { Router } from 'express';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { verificarPermiso } from '../middlewares/PermisoMiddleware';
import { usuarioService } from '../services/UsuarioService';
import { idEntero, validar } from '../utils/validacion';
import {
  actualizarUsuarioSchema,
  cambiarPasswordSchema,
  crearUsuarioSchema,
  estadoUsuarioSchema,
  rolSchema,
} from '../validators/UsuarioValidators';

const router = Router();

router.use(verificarToken);

/** GET /api/usuarios — lista todos los usuarios. */
router.get('/', verificarPermiso('usuarios', 'ver'), async (_req, res, next) => {
  try {
    res.json(await usuarioService.listar());
  } catch (error) {
    next(error);
  }
});

/** GET /api/usuarios/:id — un usuario. */
router.get('/:id', verificarPermiso('usuarios', 'ver'), async (req, res, next) => {
  try {
    res.json(await usuarioService.obtenerPorId(idEntero(req.params.id, 'usuario')));
  } catch (error) {
    next(error);
  }
});

/** POST /api/usuarios — crea un usuario. */
router.post('/', verificarPermiso('usuarios', 'crear'), async (req, res, next) => {
  try {
    const datos = validar(crearUsuarioSchema, req.body);
    res.status(201).json(await usuarioService.crear(datos, req.user!.id_usuario));
  } catch (error) {
    next(error);
  }
});

/** PUT /api/usuarios/:id — actualiza nombre/teléfono. */
router.put('/:id', verificarPermiso('usuarios', 'editar'), async (req, res, next) => {
  try {
    const datos = validar(actualizarUsuarioSchema, req.body);
    res.json(await usuarioService.actualizar(idEntero(req.params.id, 'usuario'), datos));
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/usuarios/:id/rol — cambia el rol. */
router.patch('/:id/rol', verificarPermiso('usuarios', 'cambiar_rol'), async (req, res, next) => {
  try {
    const { rol } = validar(rolSchema, req.body);
    res.json(await usuarioService.cambiarRol(idEntero(req.params.id, 'usuario'), rol, req.user!.id_usuario));
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/usuarios/:id/estado — activa, desactiva o suspende. */
router.patch(
  '/:id/estado',
  verificarPermiso('usuarios', 'cambiar_estado'),
  async (req, res, next) => {
    try {
      const { estado } = validar(estadoUsuarioSchema, req.body);
      res.json(
        await usuarioService.cambiarEstado(idEntero(req.params.id, 'usuario'), estado, req.user!.id_usuario)
      );
    } catch (error) {
      next(error);
    }
  }
);

/** PUT /api/usuarios/:id/password — cambia la contraseña (solo la propia). */
router.put(
  '/:id/password',
  verificarPermiso('usuarios', 'cambiar_password'),
  async (req, res, next) => {
    try {
      const { password } = validar(cambiarPasswordSchema, req.body);
      res.json(
        await usuarioService.cambiarPassword(
          idEntero(req.params.id, 'usuario'),
          password,
          req.user!.id_usuario
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

/** DELETE /api/usuarios/:id — borrado LÓGICO (desactiva la cuenta). */
router.delete('/:id', verificarPermiso('usuarios', 'cambiar_estado'), async (req, res, next) => {
  try {
    res.json(await usuarioService.eliminar(idEntero(req.params.id, 'usuario'), req.user!.id_usuario));
  } catch (error) {
    next(error);
  }
});

export default router;
