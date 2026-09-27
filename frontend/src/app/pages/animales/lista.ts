// ============================================================
// pages/animales/lista.ts
// Listado de animales con filtros por estado del Índice,
// especie y búsqueda por texto.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Animal, EstadoIndice } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-animales-lista',
  imports: [FormsModule, RouterLink, IconoComponent, NgIf, NgFor],
  templateUrl: './lista.html',
  styleUrl: './lista.css',
})
export class AnimalesListaComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly animales = signal<Animal[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  /** Filtros que se envían a la API. */
  readonly texto = signal('');
  readonly estadoIndice = signal<EstadoIndice | ''>('');
  readonly especie = signal('');

  /** ¿Puede el usuario registrar animales? */
  readonly puedeCrear = () => this.auth.puede('animales', 'crear');

  ngOnInit() {
    this.cargar();
  }

  /** Descarga la lista con los filtros actuales. */
  cargar() {
    this.cargando.set(true);
    this.error.set('');

    const filtros: Record<string, string> = {};
    if (this.texto()) filtros['texto'] = this.texto();
    if (this.estadoIndice()) filtros['estado_indice'] = this.estadoIndice();
    if (this.especie()) filtros['especie'] = this.especie();

    this.api.listarAnimales(filtros).subscribe({
      next: (animales) => {
        this.animales.set(animales);
        this.cargando.set(false);
      },
      error: (respuesta) => {
        this.error.set(respuesta?.error?.mensaje ?? 'No se pudieron cargar los animales');
        this.cargando.set(false);
      },
    });
  }

  /** Limpia los filtros y recarga. */
  limpiarFiltros() {
    this.texto.set('');
    this.estadoIndice.set('');
    this.especie.set('');
    this.cargar();
  }

  /** Clase de la insignia del Índice de Estado. */
  claseIndice(indice: EstadoIndice): string {
    if (indice === 'ATENCION') return 'badge-peligro';
    if (indice === 'OBSERVACION') return 'badge-alerta';
    return 'badge-exito';
  }

  /** Clase de la insignia del estado del animal. */
  claseEstado(estado: string): string {
    return estado === 'ACTIVO' ? 'badge-exito' : 'badge-neutro';
  }

  /** Convierte "2024-01-10T06:00:00.000Z" en "10/01/2024". */
  fecha(valor: string | null): string {
    if (!valor) return '-';

    const d = new Date(valor);
    return d.toLocaleDateString('es-MX');
  }
}
