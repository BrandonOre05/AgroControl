// ============================================================
// app.ts
// Componente raíz. Solo muestra el <router-outlet /> y, al arrancar,
// revisa que la sesión guardada siga siendo válida.
//
// Las rutas NO se registran aquí: eso lo hace app.config.ts con
// importProvidersFrom(AppRoutingModule). Este componente solo
// necesita la directiva <router-outlet />.
// ============================================================

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  private auth = inject(AuthService);

  constructor() {
    // Si el usuario ya tenía sesión, comprobamos con el backend que el
    // token siga siendo válido y que sus datos (nombre, rol) estén al día.
    this.auth.verificarSesion();
  }
}
