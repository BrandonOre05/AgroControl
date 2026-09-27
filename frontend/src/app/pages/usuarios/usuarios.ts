// ============================================================
// pages/usuarios/usuarios.ts
// Administración de usuarios (CRUD completo).
//
// Esta pantalla SOLO aparece para el ADMIN: el backend responde
// 403 a cualquier otro rol, y el menú ni siquiera le muestra el
// acceso (ver matriz de permisos).
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Usuario } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, IconoComponent, NgIf, NgFor],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly mensaje = signal('');

  /** ¿Está abierto el formulario (crear/editar)? */
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);

  /** Usuario que se está editando (null = crear uno nuevo). */
  readonly editando = signal<Usuario | null>(null);

  // --- Campos del formulario ---
  readonly nombre = signal('');
  readonly correo = signal('');
  readonly telefono = signal('');
  readonly password = signal('');
  readonly rol = signal('TRABAJADOR');

  /** Id del admin conectado: no puede desactivarse ni borrarse. */
  readonly miId = this.auth.usuario()?.id_usuario ?? 0;

  ngOnInit() {
    this.cargar();
  }

  /** Descarga la lista de usuarios. */
  cargar() {
    this.cargando.set(true);

    this.api.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (respuesta) => {
        this.error.set(respuesta?.error?.mensaje ?? 'No se pudieron cargar los usuarios');
        this.cargando.set(false);
      },
    });
  }

  // ---------- Formulario ----------

  /** Abre el formulario para crear un usuario nuevo. */
  abrirCrear() {
    this.editando.set(null);
    this.nombre.set('');
    this.correo.set('');
    this.telefono.set('');
    this.password.set('');
    this.rol.set('TRABAJADOR');
    this.modalAbierto.set(true);
  }

  /** Abre el formulario para editar un usuario existente. */
  abrirEditar(usuario: Usuario) {
    this.editando.set(usuario);
    this.nombre.set(usuario.nombre);
    this.correo.set(usuario.correo);
    this.telefono.set(usuario.telefono ?? '');
    this.password.set('');
    this.rol.set(usuario.rol);
    this.modalAbierto.set(true);
  }

  /** Cierra el formulario sin guardar. */
  cerrarModal() {
    this.modalAbierto.set(false);
    this.mensaje.set('');
  }

  /** Guarda los cambios (crear o editar). */
  guardar() {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.mensaje.set('');

    const usuario = this.editando();
    const peticion = usuario
      ? this.api.actualizarUsuario(usuario.id_usuario, {
          nombre: this.nombre(),
          telefono: this.telefono(),
        })
      : this.api.crearUsuario({
          nombre: this.nombre(),
          correo: this.correo(),
          telefono: this.telefono() || undefined,
          password: this.password(),
          rol: this.rol(),
        });

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargar();
      },
      error: (respuesta) => {
        this.guardando.set(false);
        this.mensaje.set(respuesta?.error?.mensaje ?? 'No se pudo guardar el usuario');
      },
    });
  }

  // ---------- Acciones de la tabla ----------

  /** Cambia el rol desde la tabla. */
  cambiarRol(usuario: Usuario, nuevoRol: string) {
    // Si el valor no cambió, no hacemos nada
    if (nuevoRol === usuario.rol) return;

    this.api.cambiarRolUsuario(usuario.id_usuario, nuevoRol).subscribe({
      next: () => this.cargar(),
      error: (r) => this.error.set(r?.error?.mensaje ?? 'No se pudo cambiar el rol'),
    });
  }

  /** Activa o desactiva la cuenta. */
  cambiarEstado(usuario: Usuario) {
    const nuevo = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    this.api.cambiarEstadoUsuario(usuario.id_usuario, nuevo).subscribe({
      next: () => this.cargar(),
      error: (r) => this.error.set(r?.error?.mensaje ?? 'No se pudo cambiar el estado'),
    });
  }

  /** Desactiva la cuenta (borrado lógico). */
  eliminar(usuario: Usuario) {
    if (!confirm(`¿Desactivar la cuenta de ${usuario.nombre}?\n\nSu historial se conserva.`)) {
      return;
    }

    this.api.eliminarUsuario(usuario.id_usuario).subscribe({
      next: () => this.cargar(),
      error: (r) => this.error.set(r?.error?.mensaje ?? 'No se pudo desactivar'),
    });
  }

  // ---------- Utilidades ----------

  /** Clase de la insignia según el estado de la cuenta. */
  claseEstado(estado: string): string {
    if (estado === 'ACTIVO') return 'badge-exito';
    if (estado === 'SUSPENDIDO') return 'badge-peligro';
    return 'badge-neutro';
  }

  /** Formatea una fecha. */
  fecha(valor: string | null): string {
    if (!valor) return 'Nunca';

    return new Date(valor).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
