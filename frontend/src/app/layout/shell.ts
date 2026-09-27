// ============================================================
// layout/shell.ts
// Estructura general de las pantallas internas:
//
//   ┌────────────┬──────────────────────────────┐
//   │  Menú      │  Barra superior (buscador)   │
//   │  lateral   ├──────────────────────────────┤
//   │            │  Contenido de la pantalla    │
//   │  Usuario   │  (router-outlet)             │
//   └────────────┴──────────────────────────────┘
//
// El menú lateral se arma con la matriz de permisos: cada rol
// ve únicamente los módulos que le corresponden.
// ============================================================

import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { CambioPasswordComponent } from '../shared/cambio-password';
import { IconoComponent } from '../shared/icono';

/** Un elemento del menú lateral. */
interface ItemMenu {
  ruta: string;
  etiqueta: string;
  icono: string;
  modulo: string;
  accion: string;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconoComponent,
    CambioPasswordComponent,
    NgFor,
    NgIf,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  /** Muestra u oculta el menú en pantallas pequeñas. */
  readonly menuAbierto = signal(false);

  /** Contador de alertas para la insignia del menú. */
  readonly alertasActivas = signal(0);

  /**
   * Todos los módulos del sistema.
   * Los que el usuario no puede ver se filtran con `visible`.
   */
  private readonly todosLosItems: ItemMenu[] = [
    {
      ruta: '/dashboard',
      etiqueta: 'Dashboard',
      icono: 'panel',
      modulo: 'dashboard',
      accion: 'ver',
    },
    {
      ruta: '/animales',
      etiqueta: 'Animales',
      icono: 'animales',
      modulo: 'animales',
      accion: 'ver',
    },
    {
      ruta: '/salud',
      etiqueta: 'Salud',
      icono: 'salud',
      modulo: 'salud',
      accion: 'registrar_pesaje',
    },
    {
      ruta: '/cultivos',
      etiqueta: 'Cultivos',
      icono: 'cultivos',
      modulo: 'cultivos',
      accion: 'ver',
    },
    {
      ruta: '/produccion',
      etiqueta: 'Producción',
      icono: 'produccion',
      modulo: 'produccion',
      accion: 'registrar',
    },
    {
      ruta: '/inventario',
      etiqueta: 'Inventario',
      icono: 'inventario',
      modulo: 'inventario',
      accion: 'ver',
    },
    {
      ruta: '/actividades',
      etiqueta: 'Actividades',
      icono: 'actividades',
      modulo: 'actividades',
      accion: 'ver',
    },
    { ruta: '/alertas', etiqueta: 'Alertas', icono: 'alertas', modulo: 'alertas', accion: 'ver' },
    {
      ruta: '/reportes',
      etiqueta: 'Reportes',
      icono: 'reportes',
      modulo: 'reportes',
      accion: 'ver',
    },
    {
      ruta: '/usuarios',
      etiqueta: 'Usuarios',
      icono: 'usuario',
      modulo: 'usuarios',
      accion: 'ver',
    },
  ];

  /** Módulos que el usuario puede ver, más "Mi perfil" (todos lo tienen). */
  readonly menu = computed(() => {
    const modulos = this.todosLosItems.filter((item) => this.auth.puede(item.modulo, item.accion));

    // El perfil siempre está disponible para quien tenga sesión
    modulos.push({
      ruta: '/perfil',
      etiqueta: 'Mi perfil',
      icono: 'usuario',
      modulo: 'perfil',
      accion: 'ver',
    });

    return modulos;
  });

  readonly usuario = this.auth.usuario;
  readonly nombreUsuario = this.auth.nombreUsuario;

  constructor() {
    // Al entrar a la aplicación cargamos los permisos (para el menú)
    // y el número de alertas del menú.
    this.cargarPermisos();
    this.cargarAlertas();
  }

  /** Descarga la matriz de permisos del backend. */
  private cargarPermisos() {
    if (Object.keys(this.auth.permisos()).length > 0) return;

    this.auth.cargarPermisos().subscribe({
      error: () => {
        // Si falla (por ejemplo, sesión vencida), seguimos al login
        this.auth.logout();
      },
    });
  }

  /** Cuenta las alertas activas para la insignia del menú. */
  private cargarAlertas() {
    if (!this.auth.puede('alertas', 'ver')) return;

    this.api.listarAlertas({ estado: 'ACTIVA' }).subscribe({
      next: (alertas) => this.alertasActivas.set(alertas.length),
      error: () => {},
    });
  }

  /** Cierra la sesión y vuelve al login. */
  salir() {
    this.auth.logout();
  }

  // ---------- Cambio de contraseña ----------

  /** ¿Está abierta la ventana de cambio de contraseña? */
  readonly modalPassword = signal(false);

  /** Abre la ventana. */
  abrirPassword() {
    this.modalPassword.set(true);
  }

  /** Cierra el menú lateral (en pantallas pequeñas). */
  cerrarMenu() {
    this.menuAbierto.set(false);
  }
}
