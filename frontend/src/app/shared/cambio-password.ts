// ============================================================
// shared/cambio-password.ts
// Ventana de cambio de contraseña.
//
// Se usa en DOS lugares: el menú lateral y la pantalla de perfil.
// Por eso vive aquí en vez de estar duplicado en cada pantalla.
//
// Uso:
//   <app-cambio-password [abierto]="mostrar()" (cerrado)="mostrar.set(false)" />
//
// Usa @Input para recibir el valor del padre y @Output para avisarle
// cuando se cierra (así se comunican los componentes).
// ============================================================

import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-cambio-password',
  imports: [FormsModule, NgIf],
  template: `
    <div class="capa" *ngIf="abierto" (click)="cerrar()"></div>

    <div class="modal" *ngIf="abierto">
      <div class="fila-between modal-cabecera">
        <h2>Cambiar contraseña</h2>
        <button class="cerrar" (click)="cerrar()">✕</button>
      </div>

      <div class="campo">
        <label>Contraseña actual</label>
        <input type="password" [ngModel]="actual()" (ngModelChange)="actual.set($event)" />
      </div>

      <div class="campo">
        <label>Contraseña nueva</label>
        <input type="password" [ngModel]="nueva()" (ngModelChange)="nueva.set($event)" />
        <p class="ayuda">Mínimo 8 caracteres, con mayúscula, minúscula y número.</p>
      </div>

      <div class="campo">
        <label>Repite la contraseña nueva</label>
        <input type="password" [ngModel]="repetir()" (ngModelChange)="repetir.set($event)" />
      </div>

      <p class="rojo" *ngIf="error()">{{ error() }}</p>
      <p class="verde" *ngIf="exito()">{{ exito() }}</p>

      <div class="modal-pie">
        <button class="btn btn-fantasma" (click)="cerrar()">Cancelar</button>
        <button class="btn btn-primario" (click)="guardar()" [disabled]="guardando()">
          {{ guardando() ? 'Guardando...' : 'Cambiar contraseña' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .capa {
      position: fixed;
      inset: 0;
      background: var(--tapa);
      z-index: 60;
    }

    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(420px, calc(100% - 32px));
      background: var(--card-2);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: var(--radio-lg);
      padding: 26px;
      z-index: 61;
      box-shadow: var(--sombra);
    }

    .modal-cabecera {
      margin-bottom: 18px;
    }

    .modal-cabecera h2 {
      font-size: 17px;
    }

    .cerrar {
      background: transparent;
      border: none;
      color: var(--texto-suave);
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 6px;
    }

    .modal-pie {
      display: flex;
      justify-content: flex-end;
      gap: 9px;
      margin-top: 20px;
    }

    .ayuda {
      font-size: 11px;
      color: var(--texto-tenue);
      margin-top: 5px;
    }

    .rojo {
      background: rgba(192, 80, 63, 0.1);
      border: 1px solid rgba(192, 80, 63, 0.3);
      color: #a8412f;
      padding: 10px 13px;
      border-radius: var(--radio-sm);
      font-size: 12px;
      margin-bottom: 14px;
    }

    .verde {
      background: rgba(63, 157, 99, 0.12);
      border: 1px solid rgba(63, 157, 99, 0.3);
      color: #2c7a4b;
      padding: 10px 13px;
      border-radius: var(--radio-sm);
      font-size: 12px;
      margin-bottom: 14px;
    }
  `,
})
export class CambioPasswordComponent {
  private api = inject(ApiService);

  /** ¿Está abierta la ventana? Lo decide el componente padre. */
  @Input() abierto = false;

  /** Avisa al padre que se cerró la ventana. */
  @Output() cerrado = new EventEmitter<void>();

  readonly actual = signal('');
  readonly nueva = signal('');
  readonly repetir = signal('');
  readonly error = signal('');
  readonly exito = signal('');
  readonly guardando = signal(false);

  /** Cierra la ventana y limpia los campos. */
  cerrar(): void {
    this.actual.set('');
    this.nueva.set('');
    this.repetir.set('');
    this.error.set('');
    this.exito.set('');
    this.cerrado.emit();
  }

  /** Valida los datos y envía el cambio al backend. */
  guardar(): void {
    this.error.set('');
    this.exito.set('');

    if (this.nueva().length < 8) {
      this.error.set('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (this.nueva() !== this.repetir()) {
      this.error.set('Las contraseñas nuevas no coinciden');
      return;
    }

    if (this.actual() === this.nueva()) {
      this.error.set('La nueva contraseña debe ser distinta de la actual');
      return;
    }

    this.guardando.set(true);

    this.api.cambiarPassword(this.actual(), this.nueva()).subscribe({
      next: (r) => {
        this.guardando.set(false);
        this.exito.set(r.mensaje);
        setTimeout(() => this.cerrado.emit(), 1200);
      },
      error: (r) => {
        this.guardando.set(false);
        this.error.set(r?.error?.mensaje ?? 'No se pudo cambiar la contraseña');
      },
    });
  }
}
