// ============================================================
// services/AuthService.ts
// Lógica de negocio del inicio de sesión:
//  - busca el usuario,
//  - compara la contraseña con bcrypt,
//  - genera el token JWT.
//
// Los servicios son el "cerebro" del sistema: aquí se toman las
// decisiones. Las rutas solo orquestan y el repositorio solo hace SQL.
// ============================================================

import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { RespuestaLogin } from '../models/Auth';
import { UsuarioPublico } from '../models/Usuario';
import { usuarioRepository } from '../repositories/UsuarioRepository';
import { AppError } from '../utils/AppError';

/** Costo de bcrypt: 12 = muy seguro sin volver el login lentísimo. */
export const COSTO_BCRYPT = 12;

/**
 * Hash "dummy" para comparar cuando el correo no existe.
 * ¿Para qué? Si el usuario no existe y respondemos rápido, un atacante
 * podría descubrir qué correos SÍ existen midiendo el tiempo de respuesta.
 * Comparando siempre contra un hash falso, el tiempo es similar en ambos casos.
 */
const HASH_FALSO = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.6dQ0kQeAmL4K0d8K9Y0hK5E5E5E5E5';

export class AuthService {
  /**
   * Inicia sesión.
   * @returns el token y los datos públicos del usuario.
   */
  async login(correo: string, password: string): Promise<RespuestaLogin> {
    // 1. Buscamos incluyendo el hash para poder compararlo
    const usuario = await usuarioRepository.findByCorreo(correo, true);

    // 2. Comparamos. Si el usuario no existe, comparamos contra HASH_FALSO
    //    para no revelar por tiempo de respuesta qué correos existen.
    const hashAComparar = usuario?.password ?? HASH_FALSO;
    const passwordValida = await bcrypt.compare(password, hashAComparar);

    // Mensaje genérico: no decimos "el correo existe" ni "la contraseña está mal"
    if (!usuario || !passwordValida) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // 3. La cuenta debe estar activa
    if (usuario.estado !== 'ACTIVO') {
      throw new AppError('La cuenta no está activa', 403);
    }

    // 4. Guardamos la hora de este inicio de sesión
    await usuarioRepository.registrarUltimoLogin(usuario.id_usuario);

    // 5. Generamos el token
    const token = this.generarToken({
      id_usuario: usuario.id_usuario,
      rol: usuario.rol,
      nombre: usuario.nombre,
    });

    return {
      token,
      rol: usuario.rol,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    };
  }

  /**
   * Devuelve los datos del usuario del token actual (GET /api/auth/me).
   * Se consulta la base y no solo el token para que, si cambió el rol
   * o se suspendió la cuenta, la información esté al día.
   */
  async obtenerPerfil(idUsuario: number): Promise<UsuarioPublico> {
    const usuario = await usuarioRepository.findById(idUsuario);

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return usuario;
  }

  /**
   * Actualiza los datos del perfil propio (nombre y teléfono).
   * El correo y el rol NO se tocan: son los que definen la cuenta.
   */
  async actualizarPerfil(
    idUsuario: number,
    datos: { nombre?: string; telefono?: string }
  ): Promise<UsuarioPublico> {
    await this.obtenerPerfil(idUsuario); // Si no existe, 404

    const campos: string[] = [];
    const valores: unknown[] = [];

    if (datos.nombre !== undefined) {
      campos.push('nombre = ?');
      valores.push(datos.nombre);
    }

    if (datos.telefono !== undefined) {
      campos.push('telefono = ?');
      valores.push(datos.telefono);
    }

    if (campos.length > 0) {
      await usuarioRepository.actualizarCampos(idUsuario, campos, valores);
    }

    return this.obtenerPerfil(idUsuario);
  }

  /**
   * Cambia la contraseña del usuario que inició sesión.
   * Exige la contraseña actual para confirmar la identidad.
   */
  async cambiarPassword(
    idUsuario: number,
    passwordActual: string,
    passwordNuevo: string
  ): Promise<{ mensaje: string }> {
    // Buscamos incluyendo el hash, que es lo que necesitamos comparar
    const usuario = await usuarioRepository.findByIdConPassword(idUsuario);

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // La contraseña actual debe coincidir
    const correcta = await bcrypt.compare(passwordActual, usuario.password);

    if (!correcta) {
      throw new AppError('La contraseña actual no es correcta', 401);
    }

    // Guardamos la nueva cifrada
    const hash = await bcrypt.hash(passwordNuevo, COSTO_BCRYPT);
    await usuarioRepository.actualizarPassword(idUsuario, hash);

    return { mensaje: 'Contraseña actualizada correctamente' };
  }

  /** Crea el token JWT firmado con el secreto del .env. */
  private generarToken(payload: { id_usuario: number; rol: string; nombre: string }) {
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
    });
  }
}

export const authService = new AuthService();
