// ============================================================
// pages/salud/salud.ts
// Pantalla de Salud: resumen sanitario de todos los animales.
//
// Muestra de un vistazo qué vaccines y controles están programados
// en los próximos días y cuáles animales requieren atención.
// Desde aquí se llega a la ficha del animal para registrar.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { EstadoIndice } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

type ResumenAnimal = {
  id_animal: number;
  codigo: string;
  nombre: string | null;
  especie: string;
  estado_indice: EstadoIndice;
  proximas_vacunas: number;
  proximos_controles: number;
  ultimo_pesaje: string | null;
};

@Component({
  selector: 'app-salud',
  imports: [RouterLink, IconoComponent, NgFor, NgIf],
  templateUrl: './salud.html',
  styleUrl: './salud.css',
})
export class SaludComponent implements OnInit {
  private api = inject(ApiService);

  readonly animales = signal<ResumenAnimal[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  /** Días a mirar hacia adelante. */
  readonly dias = signal(30);

  ngOnInit() {
    this.cargar();
  }

  /** Descarga el resumen sanitario. */
  cargar() {
    this.cargando.set(true);

    this.api.resumenSalud(this.dias()).subscribe({
      next: (datos) => {
        this.animales.set(datos);
        this.cargando.set(false);
      },
      error: (r) => {
        this.error.set(r?.error?.mensaje ?? 'No se pudo cargar el resumen de salud');
        this.cargando.set(false);
      },
    });
  }

  /** Cambia el periodo y recarga. */
  cambiarPeriodo(dias: number) {
    this.dias.set(dias);
    this.cargar();
  }

  /** Totales de las tarjetas. */
  totalVacunas(): number {
    return this.animales().reduce((suma, a) => suma + a.proximas_vacunas, 0);
  }

  totalControles(): number {
    return this.animales().reduce((suma, a) => suma + a.proximos_controles, 0);
  }

  requierenAtencion(): number {
    return this.animales().filter((a) => a.estado_indice === 'ATENCION').length;
  }

  /** Clase de la insignia del Índice de Estado. */
  claseIndice(indice: EstadoIndice): string {
    if (indice === 'ATENCION') return 'badge-peligro';
    if (indice === 'OBSERVACION') return 'badge-alerta';
    return 'badge-exito';
  }

  fecha(valor: string | null): string {
    if (!valor) return 'Sin pesaje';

    return new Date(valor).toLocaleDateString('es-MX');
  }
}
