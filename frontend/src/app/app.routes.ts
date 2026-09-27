// ============================================================
// app.routes.ts
// Tabla de rutas de la aplicación.
//
//  /login      → pantalla de acceso (pública)
//  /           → todo lo demás dentro del "shell" (menú lateral),
//                protegido con authGuard
//
// Cada pantalla se carga "bajo demanda" (loadComponent): Angular
// solo descarga el código cuando el usuario entra a ella.
// ============================================================

import { Routes } from '@angular/router';
import { authGuard, permisoGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    // Rutas internas: comparten menú lateral y barra superior
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'animales',
        loadComponent: () => import('./pages/animales/lista').then((m) => m.AnimalesListaComponent),
      },
      {
        path: 'animales/:id',
        loadComponent: () =>
          import('./pages/animales/detalle').then((m) => m.AnimalDetalleComponent),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil').then((m) => m.PerfilComponent),
      },
      {
        path: 'alertas',
        loadComponent: () => import('./pages/alertas/alertas').then((m) => m.AlertasComponent),
      },
      {
        path: 'cultivos',
        loadComponent: () => import('./pages/cultivos/cultivos').then((m) => m.CultivosComponent),
      },
      {
        path: 'salud',
        loadComponent: () => import('./pages/salud/salud').then((m) => m.SaludComponent),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./pages/inventario/inventario').then((m) => m.InventarioComponent),
      },
      {
        path: 'produccion',
        loadComponent: () =>
          import('./pages/produccion/produccion').then((m) => m.ProduccionComponent),
      },
      {
        path: 'actividades',
        loadComponent: () =>
          import('./pages/actividades/actividades').then((m) => m.ActividadesComponent),
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes/reportes').then((m) => m.ReportesComponent),
      },
      {
        // Usuarios: doble protección (menú oculto + guarda de permisos)
        path: 'usuarios',
        canActivate: [authGuard, permisoGuard('usuarios', 'ver')],
        loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.UsuariosComponent),
      },
    ],
  },
  // Cualquier ruta desconocida vuelve al inicio
  { path: '**', redirectTo: '' },
];
