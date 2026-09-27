// ============================================================
// pages/perfil/perfil.ts
// Pantalla "Mi perfil": todos los datos del usuario que inició
// sesión, con opción de editar su nombre/teléfono.
//
// Los datos vienen de GET /api/auth/me (el servicio de sesión ya
// los guarda al arrancar, así que no hay que pedirlos otra vez).
// ============================================================

import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CambioPasswordComponent } from '../../shared/cambio-password';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule, IconoComponent, CambioPasswordComponent, NgIf],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  /** Datos del usuario (vienen del servicio de sesión). */
  readonly perfil = this.auth.perfil;
  readonly nombreUsuario = this.auth.nombreUsuario;

  readonly cargando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  // --- Campos editables ---
  readonly nombre = signal('');
  readonly telefono = signal('');
  readonly editando = signal(false);

  // --- Ventana de contraseña (componente compartido) ---
  readonly modalPassword = signal(false);

  /** Prepara el formulario con los datos actuales. */
  editar() {
    const usuario = this.perfil();
    if (!usuario) return;

    this.nombre.set(usuario.nombre);
    this.telefono.set(usuario.telefono ?? '');
    this.error.set('');
    this.exito.set('');
    this.editando.set(true);
  }

  /** Cancela la edición. */
  cancelar() {
    this.editando.set(false);
  }

  /** Guarda los cambios y refresca el perfil. */
  guardar() {
    if (this.nombre().trim().length < 3) {
      this.error.set('El nombre debe tener al menos 3 caracteres');
      return;
    }

    this.cargando.set(true);
    this.error.set('');
    this.exito.set('');

    this.api
      .actualizarPerfil({ nombre: this.nombre(), telefono: this.telefono() || undefined })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.editando.set(false);
          this.exito.set('Datos actualizados correctamente');

          // Recargamos el perfil para que se actualice también el menú
          this.auth.cargarPerfil().subscribe({ error: () => {} });
        },
        error: (r) => {
          this.cargando.set(false);
          this.error.set(r?.error?.mensaje ?? 'No se pudieron guardar los cambios');
        },
      });
  }

  /** Clase de la insignia del rol. */
  claseRol(rol: string): string {
    if (rol === 'ADMIN') return 'badge-exito';
    if (rol === 'ENCARGADO') return 'badge-info';
    return 'badge-neutro';
  }

  /** Fecha y hora legibles. */
  fecha(valor: string | null): string {
    if (!valor) return 'Nunca';

    return new Date(valor).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /** Etiqueta legible del rol. */
  textoRol(rol: string): string {
    if (rol === 'ADMIN') return 'Administrador';
    if (rol === 'ENCARGADO') return 'Encargado de finca';
    return 'Trabajador';
  }
}
