// ============================================================
// routes/AuthRoutes.ts
// Endpoints del módulo de autenticación.
//
// Una ruta solo hace tres cosas:
//   1. Validar los datos que llegan.
//   2. Llamar al servicio.
//   3. Responder en JSON.
//
// La lógica va en el service, nunca aquí.
// ============================================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { permisosDeRol } from '../config/permisos';
import { verificarToken } from '../middlewares/AuthMiddleware';
import { authService } from '../services/AuthService';
import { AppError } from '../utils/AppError';
import { validar } from '../utils/validacion';
import { loginSchema, cambiarPasswordSchema, actualizarPerfilSchema } from '../validators/AuthValidators';

const router = Router();

/**
 * Límite de intentos de inicio de sesión.
 * Como máximo 10 intentos por IP cada 15 minutos: así un atacante
 * no puede adivinar contraseñas probando millones de combinaciones.
 */
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10, // 10 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
  },
});

/**
 * POST /api/auth/login
 * Inicia sesión con correo y contraseña.
 * Público (no requiere token), pero con límite de intentos.
 */
router.post('/login', limiteLogin, async (req, res, next) => {
  try {
    // Zod revisa el cuerpo de la petición y devuelve datos limpios
    const datos = validar(loginSchema, req.body);

    const resultado = await authService.login(datos.correo, datos.password);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Devuelve los datos del usuario que inició sesión.
 * Protegido: requiere token válido.
 */
router.get('/me', verificarToken, async (req, res, next) => {
  try {
    const perfil = await authService.obtenerPerfil(req.user!.id_usuario);
    res.json(perfil);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/me
 * Actualiza los datos del perfil del usuario que inició sesión
 * (solo nombre y teléfono).
 */
router.put('/me', verificarToken, async (req, res, next) => {
  try {
    const datos = validar(actualizarPerfilSchema, req.body);
    res.json(await authService.actualizarPerfil(req.user!.id_usuario, datos));
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/password
 * Permite a CUALQUIER usuario cambiar SU PROPIA contraseña.
 * Exige la contraseña actual como medida de seguridad: si alguien
 * abriera el navegador con la sesión abierta, no podría cambiarla
 * sin saberla.
 */
router.put('/password', verificarToken, async (req, res, next) => {
  try {
    const datos = validar(cambiarPasswordSchema, req.body);

    const resultado = await authService.cambiarPassword(
      req.user!.id_usuario,
      datos.passwordActual,
      datos.passwordNuevo
    );

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/permisos
 * Devuelve la matriz de permisos DEL USUARIO QUE INICIÓ SESIÓN,
 * pero solo con las acciones que su rol puede hacer.
 *
 * El frontend la usa para mostrar únicamente los menús y botones
 * permitidos. Ojo: esto es solo experiencia de usuario; la
 * seguridad real la aplica el backend con verificarPermiso().
 */
router.get('/permisos', verificarToken, (req, res) => {
  res.json({
    rol: req.user!.rol,
    permisos: permisosDeRol(req.user!.rol),
  });
});

export default router;
