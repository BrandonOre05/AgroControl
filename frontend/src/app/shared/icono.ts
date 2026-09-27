// ============================================================
// shared/icono.ts
// Componente con los iconos de la interfaz.
//
// Se usa así:  <app-icono nombre="animales" [tamano]="18" />
//
// NOTA: usa @Input (decorador clásico) para recibir datos del
// componente padre. Así se ve la "comunicación entre componentes".
// Todos los iconos están dibujados con SVG simple, sin librerías.
// ============================================================

import { Component, Input } from '@angular/core';
import { NgSwitch, NgSwitchCase } from '@angular/common';

@Component({
  selector: 'app-icono',
  imports: [NgSwitch, NgSwitchCase],
  template: `
    <svg
      [attr.width]="tamano"
      [attr.height]="tamano"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <ng-container [ngSwitch]="nombre">
        <ng-container *ngSwitchCase="'panel'">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'animales'">
          <ellipse cx="12" cy="15.5" rx="4.6" ry="3.8" />
          <ellipse cx="7" cy="8" rx="1.9" ry="2.4" />
          <ellipse cx="12" cy="6.5" rx="1.9" ry="2.4" />
          <ellipse cx="17" cy="8" rx="1.9" ry="2.4" />
        </ng-container>

        <ng-container *ngSwitchCase="'salud'">
          <path
            d="M20.8 6.6a4.6 4.6 0 0 0-6.5 0L12 8.9l-2.3-2.3a4.6 4.6 0 1 0-6.5 6.5l8.8 8.8 8.8-8.8a4.6 4.6 0 0 0 0-6.5Z"
          />
        </ng-container>

        <ng-container *ngSwitchCase="'inventario'">
          <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
          <path d="M3 7.5 12 12l9-4.5" />
          <path d="M12 12v9" />
        </ng-container>

        <ng-container *ngSwitchCase="'produccion'">
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </ng-container>

        <ng-container *ngSwitchCase="'actividades'">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="m8 9 1.6 1.6L12 8" />
          <path d="M14 10h4" />
          <path d="m8 15 1.6 1.6L12 14" />
          <path d="M14 16h4" />
        </ng-container>

        <ng-container *ngSwitchCase="'cultivos'">
          <path d="M12 21V10" />
          <path d="M12 10c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z" />
          <path d="M12 14c0-2.8-2.2-5-5-5 0 2.8 2.2 5 5 5Z" />
        </ng-container>

        <ng-container *ngSwitchCase="'alertas'">
          <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z" />
          <path d="M13.7 20a2 2 0 0 1-3.4 0" />
        </ng-container>

        <ng-container *ngSwitchCase="'reportes'">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </ng-container>

        <ng-container *ngSwitchCase="'buscar'">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </ng-container>

        <ng-container *ngSwitchCase="'salir'">
          <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
          <path d="m16 16 4-4-4-4" />
          <path d="M20 12H9" />
        </ng-container>

        <ng-container *ngSwitchCase="'usuario'">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-3.9 3.6-6 8-6s8 2.1 8 6" />
        </ng-container>

        <ng-container *ngSwitchCase="'mas'">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </ng-container>

        <ng-container *ngSwitchCase="'editar'">
          <path d="M4 20h4l10-10-4-4L4 16v4Z" />
          <path d="m14 6 4 4" />
        </ng-container>

        <ng-container *ngSwitchCase="'borrar'">
          <path d="M4 7h16" />
          <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
        </ng-container>

        <ng-container *ngSwitchCase="'descargar'">
          <path d="M12 3v12" />
          <path d="m7 11 5 5 5-5" />
          <path d="M4 20h16" />
        </ng-container>

        <ng-container *ngSwitchCase="'volver'">
          <path d="M19 12H5" />
          <path d="m11 6-6 6 6 6" />
        </ng-container>

        <ng-container *ngSwitchCase="'check'">
          <path d="m4 12 5 5L20 6" />
        </ng-container>

        <ng-container *ngSwitchCase="'menu'">
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </ng-container>
      </ng-container>
    </svg>
  `,
})
export class IconoComponent {
  /** Nombre del icono (ver el ngSwitch de la plantilla). */
  @Input() nombre!: string;

  /** Tamaño en píxeles. */
  @Input() tamano = 18;
}
