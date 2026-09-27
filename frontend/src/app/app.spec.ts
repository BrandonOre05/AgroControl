// ============================================================
// app.spec.ts
// Pruebas del componente raíz. Comprueban dos cosas:
//   1. que la aplicación arranca;
//   2. que el RouterModule (app-routing.module.ts) enruta bien.
//
// Se usa appConfig.providers para que la prueba use exactamente la
// misma configuración que la app real (incluido el router).
// ============================================================

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        // La API se sustituye por una falsa: estas pruebas no usan la red.
        provideHttpClient(),
        provideHttpClientTesting(),
        ...appConfig.providers,
      ],
    }).compileComponents();
  });

  it('crea la aplicación', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('registra las rutas y muestra la pantalla de acceso', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigate(['/login']);
    await fixture.whenStable();
    fixture.detectChanges();

    // El <router-outlet /> debe haber dibujado el formulario de login
    const pantalla = fixture.nativeElement as HTMLElement;
    expect(pantalla.querySelector('form')).toBeTruthy();
    expect(pantalla.textContent).toContain('Bienvenido de nuevo');
  });
});
