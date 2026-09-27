// ============================================================
// pages/dashboard/dashboard.ts
// Panel de control: el resumen general de la finca.
//
// Los datos vienen de GET /api/dashboard, que ya calcula en el
// backend los totales, el Índice de Estado y las alertas.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Alerta, ResumenDashboard, EstadoIndice } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-dashboard',
  imports: [IconoComponent, NgIf, NgFor],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  /** Datos del panel (null mientras carga). */
  readonly datos = signal<ResumenDashboard | null>(null);

  /** Últimas alertas activas que se muestran en la lista. */
  readonly alertas = signal<Alerta[]>([]);

  readonly cargando = signal(true);
  readonly error = signal('');

  readonly nombreUsuario = this.auth.nombreUsuario;
  readonly puedeVerInventario = () => this.auth.puede('inventario', 'ver');
  readonly puedeVerAlertas = () => this.auth.puede('alertas', 'ver');

  /** Fecha de hoy, mostrada en el encabezado. */
  readonly hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  ngOnInit() {
    this.cargar();
  }

  /** Descarga el resumen y las alertas. */
  cargar() {
    this.cargando.set(true);
    this.error.set('');

    this.api.obtenerDashboard().subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (respuesta) => {
        this.error.set(respuesta?.error?.mensaje ?? 'No se pudo cargar el panel');
        this.cargando.set(false);
      },
    });

    if (this.puedeVerAlertas()) {
      this.api.listarAlertas({ estado: 'ACTIVA' }).subscribe({
        next: (alertas) => this.alertas.set(alertas.slice(0, 6)),
        error: () => {},
      });
    }
  }

  /** Cantidad de animales con un estado del Índice. */
  cantidad(indice: EstadoIndice): number {
    return this.datos()?.animales.por_indice.find((i) => i.indice === indice)?.cantidad ?? 0;
  }

  /**
   * Porcentaje de cada estado del Índice, para colorear la dona.
   * Se usa con la función CSS conic-gradient.
   */
  porcentaje(indice: EstadoIndice): number {
    const total = this.datos()?.animales.total ?? 0;

    if (total === 0) return 0;

    return Math.round((this.cantidad(indice) / total) * 100);
  }

  /** Class CSS de la insignia según la severidad de la alerta. */
  claseSeveridad(severidad: string): string {
    if (severidad === 'CRITICA') return 'badge-peligro';
    if (severidad === 'ADVERTENCIA') return 'badge-alerta';
    return 'badge-info';
  }

  /** Formatea un número con separador de miles. */
  formato(n: number | null | undefined): string {
    return (n ?? 0).toLocaleString('es-MX');
  }
}
