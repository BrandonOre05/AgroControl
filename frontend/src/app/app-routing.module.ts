// ============================================================
// app-routing.module.ts
// Módulo de rutas de la aplicación (la forma clásica del curso).
//
// RouterModule.forRoot(routes) le dice a Angular qué rutas existen
// y además exporta las directivas de navegación (router-outlet,
// routerLink, routerLinkActive).
//
// OJO (importante): este módulo NO se importa en app.ts. Como la
// aplicación arranca con bootstrapApplication (standalone), el
// módulo hay que registrarlo en app.config.ts con
// importProvidersFrom(AppRoutingModule). Si se importara dentro de
// un componente, el router se proveería en el injector de ese
// componente y Angular se quejaría con:
//   NG04007: The Router was provided more than once.
// ============================================================

import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

@NgModule({
  // forRoot: solo en el módulo principal (el que inicia la app).
  imports: [RouterModule.forRoot(routes)],
  // export: para poder usar <router-outlet />, <routerLink>...
  exports: [RouterModule],
})
export class AppRoutingModule {}
