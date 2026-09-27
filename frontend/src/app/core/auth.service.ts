// ============================================================
// core/auth.service.ts
// Maneja la sesión del usuario: iniciar sesión, guardar el token,
// cargar los permisos y cerrar sesión.
//
// El token se guarda en localStorage para que la sesión sobreviva
// al recargar la página (es un proyecto web de escritorio).
// ============================================================

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespuestaLogin, RespuestaPermisos, Rol, Usuario } from './models';

/** Datos de la sesión guardada en el navegador. */
/** Datos mínimos del usuario que se guardan en el navegador. */
export interface UsuarioSesion {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

const CLAVE_TOKEN = 'agrocontrol_token';
const CLAVE_PERMISOS = 'agrocontrol_permisos';
const CLAVE_USUARIO = 'agrocontrol_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // --- Señales (estado reactivo de Angular) ---

  /** Token de la sesión actual (null si no hay sesión). */
  readonly token = signal<string | null>(localStorage.getItem(CLAVE_TOKEN));

  /** Usuario de la sesión actual (datos mínimos para mostrar en el menú). */
  readonly usuario = signal<UsuarioSesion | null>(this.leerUsuario());

  /** Matriz de permisos del rol, ya filtrada. */
  private readonly _permisos = signal<Record<string, Record<string, boolean>>>(this.leerPermisos());
  readonly permisos = this._permisos.asReadonly();

  /** Datos del perfil completo (los pide /api/auth/me). */
  private readonly _perfil = signal<Usuario | null>(null);
  readonly perfil = this._perfil.asReadonly();

  /** Verdadero si hay sesión iniciada. */
  readonly autenticado = computed(() => !!this.token());

  /** Nombre a mostrar en el menú. */
  readonly nombreUsuario = computed(() => this.usuario()?.nombre ?? 'Usuario');

  // --- Inicio de sesión ---

  /** Envía las credenciales. Si todo sale bien, guarda la sesión. */
  login(correo: string, password: string) {
    return this.http
      .post<RespuestaLogin>(`${environment.apiUrl}/auth/login`, { correo, password })
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  /** Carga los permisos del usuario (lo usa el menú lateral). */
  cargarPermisos() {
    return this.http.get<RespuestaPermisos>(`${environment.apiUrl}/auth/permisos`).pipe(
      tap((r) => {
        // Guardamos en el navegador...
        localStorage.setItem(CLAVE_PERMISOS, JSON.stringify(r.permisos));
        // ...y actualizamos el estado en memoria, que es el que usa el menú.
        // Sin esto, el menú se quedaría con los permisos del usuario anterior.
        this._permisos.set(r.permisos);
      }),
    );
  }

  /** Carga el perfil completo del usuario. */
  cargarPerfil() {
    return this.http.get<Usuario>(`${environment.apiUrl}/auth/me`).pipe(
      tap((perfil) => {
        // Guardamos el perfil completo y refrescamos los datos del menú
        // (por si el nombre o el rol cambiaron en el servidor).
        this._perfil.set(perfil);

        const usuario: UsuarioSesion = {
          id_usuario: perfil.id_usuario,
          nombre: perfil.nombre,
          correo: perfil.correo,
          rol: perfil.rol,
        };

        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
        this.usuario.set(usuario);
      }),
    );
  }

  // --- Cierre de sesión ---

  /** Borra la sesión guardada y vuelve al login. */
  logout() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_PERMISOS);
    localStorage.removeItem(CLAVE_USUARIO);

    this.token.set(null);
    this.usuario.set(null);
    this._permisos.set({});
    this._perfil.set(null);

    this.router.navigate(['/login']);
  }

  /**
   * Revisa la sesión guardada al abrir la aplicación.
   *
   * ¿Por qué? Porque el token y los datos del usuario quedan guardados en
   * el navegador. Si el rol cambió, la cuenta se suspendió o el token
   * expiró, aquí lo detectamos y corregimos de una vez.
   *
   * La llama AppComponent al arrancar.
   */
  verificarSesion() {
    if (!this.autenticado()) return;

    // Pedimos el perfil real al backend: si el token ya no sirve,
    // el interceptor de errores se encarga de cerrar la sesión.
    this.cargarPerfil().subscribe({
      next: () => {
        // Todo bien: refrescamos los permisos del rol actual
        this.cargarPermisos().subscribe({ error: () => {} });
      },
      error: () => {},
    });
  }

  // --- Consultas de permisos ---

  /**
   * ¿El usuario actual tiene permiso para esta acción?
   * Ejemplo: auth.puede('animales', 'crear')
   */
  puede(modulo: string, accion: string): boolean {
    return this._permisos()[modulo]?.[accion] === true;
  }

  // --- Métodos privados ---

  private guardarSesion(respuesta: RespuestaLogin) {
    const usuario: UsuarioSesion = {
      id_usuario: respuesta.usuario.id_usuario,
      nombre: respuesta.usuario.nombre,
      correo: respuesta.usuario.correo,
      rol: respuesta.rol,
    };

    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));

    // Actualizamos el estado en memoria:
    // 1. El token, para que el interceptor lo envíe.
    // 2. El usuario, para que el menú muestre el nombre y el rol correctos.
    // 3. Los permisos, se vacían porque belonged al usuario anterior
    //    y se vuelven a pedir al backend con la nueva sesión.
    this.token.set(respuesta.token);
    this.usuario.set(usuario);
    this._permisos.set({});
    localStorage.removeItem(CLAVE_PERMISOS);
  }

  private leerUsuario(): UsuarioSesion | null {
    const guardado = localStorage.getItem(CLAVE_USUARIO);

    if (!guardado) return null;

    try {
      return JSON.parse(guardado) as UsuarioSesion;
    } catch {
      return null;
    }
  }

  private leerPermisos(): Record<string, Record<string, boolean>> {
    const guardado = localStorage.getItem(CLAVE_PERMISOS);

    if (!guardado) return {};

    try {
      return JSON.parse(guardado);
    } catch {
      return {};
    }
  }
}
