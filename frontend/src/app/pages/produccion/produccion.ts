// ============================================================
// pages/produccion/produccion.ts
// Pantalla de producción: tarjetas de totales, gráfica de barras
// por día y ranking de los animales que más producen.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Animal, ResumenProduccion } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-produccion',
  imports: [FormsModule, IconoComponent, NgIf, NgFor],
  templateUrl: './produccion.html',
  styleUrl: './produccion.css',
})
export class ProduccionComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly resumen = signal<ResumenProduccion | null>(null);
  readonly animales = signal<Animal[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly mensaje = signal('');

  /** Periodo en días que se está viendo. */
  readonly dias = signal(30);

  /** Periodos disponibles (pestañas del diseño). */
  readonly periodos = [
    { valor: 7, etiqueta: '7 días' },
    { valor: 30, etiqueta: '30 días' },
    { valor: 90, etiqueta: '90 días' },
  ];

  readonly puedeRegistrar = () => this.auth.puede('produccion', 'registrar');

  // --- Formulario de registro ---
  readonly modalAbierto = signal(false);
  readonly idAnimal = signal<number | null>(null);
  readonly cantidad = signal<number | null>(null);
  readonly unidad = signal('litros');
  readonly fechaRegistro = signal(new Date().toISOString().slice(0, 10));
  readonly guardando = signal(false);

  ngOnInit() {
    this.cargar();
  }

  /** Descarga el resumen y los animales (para el formulario). */
  cargar() {
    this.cargando.set(true);
    this.error.set('');

    this.api.resumenProduccion(this.dias()).subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: (r) => {
        this.error.set(r?.error?.mensaje ?? 'No se pudo cargar la producción');
        this.cargando.set(false);
      },
    });

    if (this.animales().length === 0) {
      this.api.listarAnimales({ estado_animal: 'ACTIVO' }).subscribe({
        next: (animales) => this.animales.set(animales),
        error: () => {},
      });
    }
  }

  /** Cambia el periodo y recarga. */
  cambiarPeriodo(dias: number) {
    this.dias.set(dias);
    this.cargar();
  }

  /** Total de un tipo de producción concreto. */
  total(tipo: string): number {
    return this.resumen()?.totales.find((t) => t.tipo === tipo)?.total ?? 0;
  }

  /** Unidad usada en un tipo de producción. */
  unidadDe(tipo: string): string {
    return this.resumen()?.totales.find((t) => t.tipo === tipo)?.unidad ?? '';
  }

  /**
   * Porcentaje de cada día respecto al máximo, para dibujar
   * las barras de la gráfica con CSS.
   */
  alturaBarra(total: number): number {
    const datos = this.resumen()?.por_dia ?? [];
    if (datos.length === 0) return 0;

    const maximo = Math.max(...datos.map((d) => d.total));
    if (maximo === 0) return 0;

    return Math.round((total / maximo) * 100);
  }

  /** Etiqueta corta del día (dd/mm). */
  etiquetaDia(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  }

  // ---------- Registro ----------

  guardar() {
    if (this.guardando() || !this.idAnimal()) return;
    this.guardando.set(true);
    this.mensaje.set('');

    this.api
      .registrarProduccion({
        id_animal: this.idAnimal(),
        tipo: 'LECHE',
        cantidad: this.cantidad(),
        unidad: this.unidad(),
        fecha: this.fechaRegistro(),
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalAbierto.set(false);
          this.mensaje.set('Producción registrada');
          this.cargar();
        },
        error: (r) => {
          this.guardando.set(false);
          this.mensaje.set(r?.error?.mensaje ?? 'No se pudo registrar');
        },
      });
  }

  numero(valor: number | null | undefined): string {
    return (valor ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 1 });
  }
}
