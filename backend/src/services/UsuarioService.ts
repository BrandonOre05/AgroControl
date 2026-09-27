// ============================================================
// services/UsuarioService.ts
// Administración de usuarios (CRUD completo).
//
// ¿Quién puede entrar aquí? Solo el ADMIN, según la matriz de
// permisos (config/permisos.ts → usuarios).
// ============================================================

import bcrypt from 'bcryptjs';
import { EstadoUsuario, Rol, UsuarioPublico } from '../models/Usuario';
import { usuarioRepository } from '../repositories/UsuarioRepository';
import { AppError } from '../utils/AppError';
import { COSTO_BCRYPT } from './AuthService';

export class UsuarioService {
  /** Lista todos los usuarios. */
  async listar(): Promise<UsuarioPublico[]> {
    return usuarioRepository.findAll();
  }

  /** Obtiene un usuario por id. */
  async obtenerPorId(id: number): Promise<UsuarioPublico> {
    const usuario = await usuarioRepository.findById(id);

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return usuario;
  }

  /** Crea un usuario nuevo con la contraseña cifrada. */
  async crear(
    datos: { nombre: string; correo: string; password: string; rol: Rol; telefono?: string },
    idAdmin: number
  ): Promise<UsuarioPublico> {
    // El correo no se puede repetir
    const existente = await usuarioRepository.findByCorreo(datos.correo);
    if (existente) {
      throw new AppError('El correo ya está registrado', 409);
    }

    // La contraseña NUNCA se guarda en texto plano
    const hash = await bcrypt.hash(datos.password, COSTO_BCRYPT);

    const id = await usuarioRepository.create(
      {
        nombre: datos.nombre,
        correo: datos.correo,
        password: hash,
        rol: datos.rol,
        telefono: datos.telefono,
      },
      idAdmin
    );

    return this.obtenerPorId(id);
  }

  /** Actualiza los datos de un usuario (no la contraseña ni el rol). */
  async actualizar(
    id: number,
    datos: { nombre?: string; telefono?: string }
  ): Promise<UsuarioPublico> {
    await this.obtenerPorId(id); // Si no existe, 404

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
      await usuarioRepository.actualizarCampos(id, campos, valores);
    }

    return this.obtenerPorId(id);
  }

  /**
   * Cambia el rol de un usuario.
   * Evita que un admin se quede sin otros admins o se quite el rol a sí mismo.
   */
  async cambiarRol(id: number, rol: Rol, idAdmin: number): Promise<UsuarioPublico> {
    await this.obtenerPorId(id);

    if (id === idAdmin) {
      throw new AppError('No puedes cambiar tu propio rol', 409);
    }

    await usuarioRepository.actualizarRol(id, rol);

    return this.obtenerPorId(id);
  }

  /**
   * Activa o desactiva una cuenta.
   * Un admin tampoco puede desactivarse a sí mismo.
   */
  async cambiarEstado(
    id: number,
    estado: EstadoUsuario,
    idAdmin: number
  ): Promise<UsuarioPublico> {
    await this.obtenerPorId(id);

    if (id === idAdmin) {
      throw new AppError('No puedes desactivar tu propia cuenta', 409);
    }

    await usuarioRepository.actualizarEstado(id, estado);

    return this.obtenerPorId(id);
  }

  /**
   * "Elimina" un usuario de forma LÓGICA (lo desactiva).
   * Nunca borramos el registro porque tiene historial (actividades,
   * registros deanimals, etc.).
   */
  async eliminar(id: number, idAdmin: number): Promise<{ mensaje: string }> {
    const usuario = await this.obtenerPorId(id);

    if (id === idAdmin) {
      throw new AppError('No puedes eliminar tu propia cuenta', 409);
    }

    await usuarioRepository.actualizarEstado(id, 'INACTIVO');

    return { mensaje: `El usuario ${usuario.nombre} fue desactivado (borrado lógico)` };
  }

  /** Cambia la contraseña de un usuario (la cifra con bcrypt). */
  async cambiarPassword(id: number, password: string, idAdmin: number): Promise<{ mensaje: string }> {
    await this.obtenerPorId(id);

    if (id !== idAdmin) {
      throw new AppError('Un administrador no puede cambiar la contraseña de otro usuario', 403);
    }

    const hash = await bcrypt.hash(password, COSTO_BCRYPT);

    await usuarioRepository.actualizarPassword(id, hash);

    return { mensaje: 'Contraseña actualizada correctamente' };
  }
}

export const usuarioService = new UsuarioService();
