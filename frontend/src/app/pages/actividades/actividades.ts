// ============================================================
// pages/actividades/actividades.ts
// Pantalla de tareas del personal: tabla con filtros por estado
// y cambio rápido de estado (cualquier rol puede marcar avance).
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { EstadoTarea, Tarea } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-actividades',
  imports: [FormsModule, IconoComponent, NgIf, NgFor],
  templateUrl: './actividades.html',
  styleUrl: './actividades.css',
})
export class ActividadesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly tareas = signal<Tarea[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly filtro = signal<EstadoTarea | ''>('');
  readonly contadores = signal<Record<string, number>>({});

  readonly puedeCrear = () => this.auth.puede('actividades', 'crear');
  readonly puedeAvanzar = () => this.auth.puede('actividades', 'registrar_avance');

  // --- Formulario ---
  readonly modalAbierto = signal(false);
  readonly nombre = signal('');
  readonly tipo = signal('GANADERA');
  readonly fecha = signal(new Date().toISOString().slice(0, 10));
  readonly hora = signal('');
  readonly guardando = signal(false);

  ngOnInit() {
    this.cargar();
  }

  /** Descarga las tareas y los contadores. */
  cargar() {
    this.cargando.set(true);

    const filtros: Record<string, string> = {};
    if (this.filtro()) filtros['estado'] = this.filtro();

    this.api.listarActividades(filtros).subscribe({
      next: (tareas) => {
        this.tareas.set(tareas);
        this.cargando.set(false);
      },
      error: (r) => {
        this.error.set(r?.error?.mensaje ?? 'No se pudieron cargar las actividades');
        this.cargando.set(false);
      },
    });

    // Contadores para las pestañas
    this.api.listarActividades().subscribe({
      next: (todas) => {
        const conteo: Record<string, number> = {
          PENDIENTE: 0,
          EN_PROCESO: 0,
          COMPLETADA: 0,
          CANCELADA: 0,
        };

        for (const t of todas) {
          conteo[t.estado] = (conteo[t.estado] ?? 0) + 1;
        }

        this.contadores.set(conteo);
      },
      error: () => {},
    });
  }

  /** Cambia la pestaña de filtro. */
  filtrar(estado: EstadoTarea | '') {
    this.filtro.set(estado);
    this.cargar();
  }

  /** Cambia el estado de una tarea. */
  cambiarEstado(tarea: Tarea, estado: EstadoTarea) {
    this.api.cambiarEstadoTarea(tarea.id_actividad, estado).subscribe({
      next: () => {
        this.mensaje.set(`"${tarea.nombre}" → ${estado}`);
        this.cargar();
      },
      error: (r) => this.error.set(r?.error?.mensaje ?? 'No se pudo actualizar'),
    });
  }

  /** Guarda una tarea nueva. */
  guardar() {
    if (this.guardando()) return;
    this.guardando.set(true);

    this.api
      .crearTarea({
        nombre: this.nombre(),
        tipo: this.tipo(),
        fecha: this.fecha(),
        hora: this.hora() || undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalAbierto.set(false);
          this.mensaje.set('Actividad creada');
          this.nombre.set('');
          this.cargar();
        },
        error: (r) => {
          this.guardando.set(false);
          this.mensaje.set(r?.error?.mensaje ?? 'No se pudo crear la actividad');
        },
      });
  }

  /** Clase de la insignia del estado. */
  claseEstado(estado: string): string {
    if (estado === 'COMPLETADA') return 'badge-exito';
    if (estado === 'EN_PROCESO') return 'badge-info';
    if (estado === 'CANCELADA') return 'badge-neutro';
    return 'badge-alerta';
  }

  /** Texto legible del tipo. */
  textoTipo(tipo: string): string {
    return tipo.charAt(0) + tipo.slice(1).toLowerCase().replace('_', ' ');
  }

  /** Formatea una fecha para la tabla. */
  formatearFecha(valor: string | null): string {
    if (!valor) return '-';
    return new Date(valor).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  }
}
