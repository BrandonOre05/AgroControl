// ============================================================
// pages/cultivos/cultivos.ts
// Pantalla de cultivos: rejilla de tarjetas con la etapa de
// cada cultivo, filtros por etapa y formulario de registro.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Cultivo, EtapaCultivo } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

/** Orden del ciclo de vida (se usa para calcular el progreso). */
const ETAPAS: EtapaCultivo[] = [
  'PREPARACION',
  'SIEMBRA',
  'CRECIMIENTO',
  'MANTENIMIENTO',
  'COSECHA',
  'FINALIZADA',
];

@Component({
  selector: 'app-cultivos',
  imports: [FormsModule, IconoComponent, NgIf, NgFor],
  templateUrl: './cultivos.html',
  styleUrl: './cultivos.css',
})
export class CultivosComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly cultivos = signal<Cultivo[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly mensaje = signal('');

  /** Filtro por etapa ('' = todos). */
  readonly filtroEtapa = signal<EtapaCultivo | ''>('');

  /** ¿Puede este rol crear o editar cultivos? */
  readonly puedeEditar = () => this.auth.puede('cultivos', 'crear');

  // --- Formulario de registro ---
  readonly modalAbierto = signal(false);
  readonly guardando = signal(false);
  readonly nombre = signal('');
  readonly tipo = signal('');
  readonly area = signal<number | null>(null);
  readonly fechaSiembra = signal(new Date().toISOString().slice(0, 10));
  readonly fechaCosecha = signal('');
  readonly ubicacion = signal('');

  ngOnInit() {
    this.cargar();
  }

  /** Descarga la lista de cultivos con el filtro actual. */
  cargar() {
    this.cargando.set(true);
    this.error.set('');

    const filtros: Record<string, string> = {};
    if (this.filtroEtapa()) filtros['etapa'] = this.filtroEtapa();

    this.api.listarCultivos(filtros).subscribe({
      next: (cultivos) => {
        this.cultivos.set(cultivos);
        this.cargando.set(false);
      },
      error: (respuesta) => {
        this.error.set(respuesta?.error?.mensaje ?? 'No se pudieron cargar los cultivos');
        this.cargando.set(false);
      },
    });
  }

  /** Cambia la pestaña de filtro y recarga. */
  filtrar(etapa: EtapaCultivo | '') {
    this.filtroEtapa.set(etapa);
    this.cargar();
  }

  // ---------- Formulario ----------

  abrirFormulario() {
    this.nombre.set('');
    this.tipo.set('');
    this.area.set(null);
    this.fechaSiembra.set(new Date().toISOString().slice(0, 10));
    this.fechaCosecha.set('');
    this.ubicacion.set('');
    this.modalAbierto.set(true);
  }

  cerrarFormulario() {
    this.modalAbierto.set(false);
    this.mensaje.set('');
  }

  guardar() {
    if (this.guardando()) return;

    this.guardando.set(true);
    this.mensaje.set('');

    this.api
      .crearCultivo({
        nombre: this.nombre(),
        tipo: this.tipo() || undefined,
        area: this.area() ?? undefined,
        fecha_siembra: this.fechaSiembra(),
        fecha_cosecha_estimada: this.fechaCosecha() || undefined,
        ubicacion: this.ubicacion() || undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarFormulario();
          this.cargar();
        },
        error: (respuesta) => {
          this.guardando.set(false);
          this.mensaje.set(respuesta?.error?.mensaje ?? 'No se pudo guardar el cultivo');
        },
      });
  }

  // ---------- Acciones de tarjeta ----------

  /**
   * Avanza el cultivo a la siguiente etapa.
   * Si ya está en FINALIZADA no hace nada.
   */
  avanzar(cultivo: Cultivo) {
    const posicion = ETAPAS.indexOf(cultivo.etapa);

    if (posicion >= ETAPAS.length - 1) return;

    this.api.cambiarEtapaCultivo(cultivo.id_cultivo, ETAPAS[posicion + 1]).subscribe({
      next: () => this.cargar(),
      error: (r) => this.error.set(r?.error?.mensaje ?? 'No se pudo cambiar la etapa'),
    });
  }

  /** Cancela el cultivo. */
  cancelar(cultivo: Cultivo) {
    if (!confirm(`¿Cancelar el cultivo "${cultivo.nombre}"?`)) return;

    this.api.cambiarEstadoCultivo(cultivo.id_cultivo, 'CANCELADO').subscribe({
      next: () => this.cargar(),
      error: (r) => this.error.set(r?.error?.mensaje ?? 'No se pudo cancelar'),
    });
  }

  // ---------- Utilidades de la vista ----------

  /** Etiqueta legible de la etapa. */
  textoEtapa(etapa: EtapaCultivo): string {
    const textos: Record<string, string> = {
      PREPARACION: 'Preparación',
      SIEMBRA: 'Siembra',
      CRECIMIENTO: 'Crecimiento',
      MANTENIMIENTO: 'Mantenimiento',
      COSECHA: 'Cosecha',
      FINALIZADA: 'Finalizado',
    };

    return textos[etapa] ?? etapa;
  }

  /** Clase de color según la etapa. */
  claseEtapa(etapa: EtapaCultivo): string {
    if (etapa === 'COSECHA') return 'badge-alerta';
    if (etapa === 'FINALIZADA') return 'badge-exito';
    if (etapa === 'CRECIMIENTO' || etapa === 'MANTENIMIENTO') return 'badge-exito';
    return 'badge-info';
  }

  /**
   * Porcentaje de avance según la etapa.
   * (Solo visual: etapa actual entre las 6 del ciclo.)
   */
  progreso(etapa: EtapaCultivo): number {
    return Math.round(((ETAPAS.indexOf(etapa) + 1) / ETAPAS.length) * 100);
  }

  /** Clase del degradado de la "foto" según la etapa. */
  colorFoto(etapa: EtapaCultivo): string {
    if (etapa === 'COSECHA') return 'ambar';
    if (etapa === 'CRECIMIENTO' || etapa === 'MANTENIMIENTO') return 'verde';
    if (etapa === 'FINALIZADA') return 'gris';
    return 'azul';
  }

  /** Días que faltan para la cosecha estimada. */
  diasParaCosecha(cultivo: Cultivo): number {
    if (!cultivo.fecha_cosecha_estimada) return 0;

    const diferencia = new Date(cultivo.fecha_cosecha_estimada).getTime() - Date.now();

    return Math.ceil(diferencia / 86400000);
  }

  /** Formatea un número con decimales. */
  numero(valor: number | null): string {
    return valor === null ? '-' : Number(valor).toLocaleString('es-MX');
  }
}
