// ============================================================
// pages/alertas/alertas.ts
// Pantalla de alertas: lista todas las alertas activas agrupadas
// por severidad, con opción de resolverlas o ignorarlas.
//
// Solo el ADMIN y el ENCARGADO pueden cerrarlas (ver la matriz
// de permisos del backend).
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Alerta, Severidad } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-alertas',
  imports: [IconoComponent, NgIf, NgFor],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css',
})
export class AlertasComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly alertas = signal<Alerta[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  /** Contadores por severidad. */
  readonly criticas = signal(0);
  readonly advertencias = signal(0);
  readonly informativas = signal(0);

  readonly puedeResolver = () => this.auth.puede('alertas', 'resolver');

  ngOnInit() {
    this.cargar();
  }

  /** Descarga las alertas activas. */
  cargar() {
    this.cargando.set(true);
    this.error.set('');

    this.api.listarAlertas({ estado: 'ACTIVA' }).subscribe({
      next: (alertas) => {
        this.alertas.set(alertas);
        this.contar(alertas);
        this.cargando.set(false);
      },
      error: (respuesta) => {
        this.error.set(respuesta?.error?.mensaje ?? 'No se pudieron cargar las alertas');
        this.cargando.set(false);
      },
    });
  }

  /** Cuenta cuántas hay de cada severidad. */
  private contar(alertas: Alerta[]) {
    this.criticas.set(alertas.filter((a) => a.severidad === 'CRITICA').length);
    this.advertencias.set(alertas.filter((a) => a.severidad === 'ADVERTENCIA').length);
    this.informativas.set(alertas.filter((a) => a.severidad === 'INFORMATIVA').length);
  }

  /** Marca la alerta como resuelta o ignorada. */
  cerrar(alerta: Alerta, estado: 'RESUELTA' | 'IGNORADA') {
    this.api.resolverAlerta(alerta.id_alerta, estado).subscribe({
      next: () => this.cargar(),
      error: (respuesta) =>
        this.error.set(respuesta?.error?.mensaje ?? 'No se pudo actualizar la alerta'),
    });
  }

  /** Clase CSS según la severidad. */
  claseSeveridad(severidad: Severidad): string {
    if (severidad === 'CRITICA') return 'badge-peligro';
    if (severidad === 'ADVERTENCIA') return 'badge-alerta';
    return 'badge-info';
  }

  /** Color del icono de cada tipo de alerta. */
  colorTipo(tipo: string): string {
    if (tipo.includes('VACUNA') || tipo.includes('TRATAMIENTO')) return 'peligro';
    if (tipo.includes('CONTROL') || tipo.includes('INVENTARIO')) return 'alerta';
    if (tipo.includes('ANIMAL')) return 'peligro';
    return 'info';
  }

  /** Nombre del icono según el tipo. */
  iconoTipo(tipo: string): string {
    if (tipo.includes('VACUNA')) return 'salud';
    if (tipo.includes('TRATAMIENTO')) return 'salud';
    if (tipo.includes('CONTROL')) return 'check';
    if (tipo.includes('INVENTARIO')) return 'inventario';
    if (tipo.includes('ACTIVIDAD')) return 'actividades';
    if (tipo.includes('COSECHA')) return 'cultivos';
    return 'animales';
  }

  /** Título legible del tipo de alerta. */
  titulo(tipo: string): string {
    const titulos: Record<string, string> = {
      VACUNA_PROXIMA: 'Vacunas próximas',
      TRATAMIENTO_PENDIENTE: 'Tratamiento pendiente',
      CONTROL_PENDIENTE: 'Control pendiente',
      INVENTARIO_BAJO: 'Inventario bajo',
      ACTIVIDAD_PENDIENTE: 'Actividad pendiente',
      COSECHA_PROXIMA: 'Cosecha próxima',
      ALIMENTACION_PENDIENTE: 'Alimentación pendiente',
      ANIMAL_OBSERVACION: 'Animal por observar',
    };

    return titulos[tipo] ?? tipo;
  }
}
