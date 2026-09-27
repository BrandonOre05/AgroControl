// ============================================================
// pages/login/login.ts
// Pantalla de inicio de sesión.
//
// Conecta con POST /api/auth/login del backend. Si las credenciales
// son correctas, guarda el token, pide los permisos y entra al
// panel de control.
// ============================================================

import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconoComponent, NgIf],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  /** Muestra el spinner mientras se valida. */
  readonly cargando = signal(false);

  /** Mensaje de error (credenciales incorrectas, servidor caído...). */
  readonly error = signal('');

  /** Formulario reactivo con validación propia. */
  readonly form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  /** Envía el formulario. */
  entrar() {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      return;
    }

    const { correo, password } = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set('');

    this.auth.login(correo!, password!).subscribe({
      next: () => {
        // Con la sesión iniciada, pedimos los permisos del rol
        // (sirven para armar el menú lateral) y entramos al panel.
        this.auth.cargarPermisos().subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => this.router.navigate(['/dashboard']),
        });
      },
      error: (respuesta) => {
        this.cargando.set(false);

        //(status 0) = el navegador no pudo NI INTENTAR conectarse:
        // casi siempre significa que el backend no está corriendo.
        if (respuesta?.status === 0) {
          this.error.set(
            'No hay conexión con el servidor de la API. ¿Está corriendo "pnpm run dev" en la carpeta backend?',
          );
          return;
        }

        // Cualquier otro error: mostramos el mensaje del backend
        this.error.set(respuesta?.error?.mensaje ?? 'No se pudo iniciar sesión');
      },
    });
  }
}
