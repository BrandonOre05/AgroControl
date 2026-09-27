// ============================================================
// app.config.ts
// Configuración general de la aplicación.
//
// Aquí se registran los providers globales:
//   - provideBrowserGlobalErrorListeners: manejo de errores global
//   - provideHttpClient(withInterceptors([...])): los dos
//     interceptores, el que añade el token y el que maneja errores
//   - importProvidersFrom(AppRoutingModule): las rutas.
//
// ¿POR QUÉ importProvidersFrom Y NO provideRouter?
// El proyecto usa RouterModule.forRoot() (la forma clásica del
// curso) dentro de app-routing.module.ts. Pero como la app arranca
// con bootstrapApplication, ese módulo hay que registrarlo aquí con
// importProvidersFrom para que sus providers lleguen al inyector
// raíz. Si se importara dentro de un componente, el router quedaría
// en el inyector de ese componente y Angular marcaría error con
// NG04007 ("The Router was provided more than once"), dejando la
// pantalla en blanco.
// ============================================================

import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { authInterceptor } from './core/auth.interceptor';
import { errorInterceptor } from './core/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    // Las rutas (RouterModule.forRoot) se registran en el inyector raíz
    importProvidersFrom(AppRoutingModule),
  ],
};
