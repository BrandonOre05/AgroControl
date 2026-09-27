// ============================================================
// pages/animales/detalle.ts
// Ficha individual del animal (la pantalla "Vaca #024" del diseño).
//
// Muestra: datos generales, Índice de Estado, historial y próximos
// eventos. Desde aquí también se registran vacunas y pesajes.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Animal, EventoHistorial, Producto, ProximoEvento, EstadoIndice } from '../../core/models';
import { TiempoRelativoPipe } from '../../shared/pipes/tiempo-relativo.pipe';
import { IconoComponent } from '../../shared/icono';

/** Pestañas de la ficha. */
type Pestana = 'informacion' | 'historial' | 'registros' | 'alimentacion';

@Component({
  selector: 'app-animal-detalle',
  imports: [
    FormsModule,
    RouterLink,
    IconoComponent,
    TiempoRelativoPipe,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    NgFor,
  ],
  templateUrl: './detalle.html',
  styleUrl: './detalle.css',
})
export class AnimalDetalleComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  readonly animal = signal<Animal | null>(null);
  readonly historial = signal<EventoHistorial[]>([]);
  readonly proximos = signal<ProximoEvento[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly pestana = signal<Pestana>('informacion');
  readonly mensaje = signal('');

  // --- Formulario de registro rápido ---
  readonly peso = signal<number | null>(null);
  readonly nombreVacuna = signal('');
  readonly proximaVacuna = signal('');
  readonly guardando = signal(false);

  readonly puedeEditar = () => this.auth.puede('animales', 'editar');
  readonly puedeVacunar = () => this.auth.puede('salud', 'registrar_vacuna');
  readonly puedePesar = () => this.auth.puede('salud', 'registrar_pesaje');
  readonly puedeAlimentar = () => this.auth.puede('alimentacion', 'registrar');

  // --- Formulario de alimentación ---
  readonly productoElegido = signal<Producto | null>(null);
  readonly cantidadAlimento = signal<number | null>(null);
  readonly fechaAlimento = signal(new Date().toISOString().slice(0, 10));
  readonly horaAlimento = signal('');
  readonly productos = signal<Producto[]>([]);

  /** Id del animal tomado de la URL. */
  private idAnimal = 0;

  ngOnInit() {
    this.idAnimal = Number(this.route.snapshot.paramMap.get('id'));

    this.cargarFicha();

    // Los productos de alimento alimentan el formulario de alimentación
    if (this.puedeAlimentar()) {
      this.api.listarProductos({ categoria: 'ALIMENTO' }).subscribe({
        next: (productos) => this.productos.set(productos),
        error: () => {},
      });
    }
  }

  /**
   * Registra la alimentación del animal.
   * Si se eligió un producto del inventario, el stock se descuenta
   * solo (lo hace el backend en una transacción).
   */
  registrarAlimento() {
    const producto = this.productoElegido();

    if (!producto || this.cantidadAlimento() || this.guardando()) return;

    this.guardando.set(true);
    this.mensaje.set('');

    this.api
      .registrarAlimentacion({
        id_animal: this.idAnimal,
        id_producto: producto.id_producto,
        tipo_alimento: producto.nombre,
        cantidad: this.cantidadAlimento(),
        unidad: producto.unidad,
        fecha: this.fechaAlimento(),
        hora: this.horaAlimento() || undefined,
      })
      .subscribe({
        next: (r) => {
          this.guardando.set(false);
          this.cantidadAlimento.set(null);
          this.horaAlimento.set('');

          // Avisamos del stock restante
          this.mensaje.set(
            r.stock_restante !== null
              ? `Alimentación registrada. Quedan ${r.stock_restante} ${producto.unidad} en inventario.`
              : 'Alimentación registrada',
          );

          this.actualizarTodo();
        },
        error: (r) => {
          this.guardando.set(false);
          this.mensaje.set(r?.error?.mensaje ?? 'No se pudo registrar la alimentación');
        },
      });
  }

  /**
   * Descarga la ficha del animal.
   *
   * Con una sola suscripción llegan las tres cosas (el animal, su
   * historial y los próximos eventos). El servicio ya las encadenó
   * con switchMap, así que aquí no hay que coordi-nar nada.
   */
  private cargarFicha() {
    this.api.fichaAnimal(this.idAnimal).subscribe({
      next: (ficha) => {
        this.animal.set(ficha.animal);
        this.historial.set(ficha.historial);
        this.proximos.set(ficha.proximos);
        this.cargando.set(false);
      },
      error: (respuesta) => {
        this.error.set(respuesta?.error?.mensaje ?? 'No se pudo cargar el animal');
        this.cargando.set(false);
      },
    });
  }

  /** Cambia la pestaña visible. */
  cambiarPestana(pestana: Pestana) {
    this.pestana.set(pestana);
  }

  /** Registra un pesaje. */
  registrarPesaje() {
    if (!this.peso() || this.guardando()) return;

    this.guardando.set(true);

    this.api.registrarPesaje(this.idAnimal, { peso: this.peso() }).subscribe({
      next: () => {
        this.mensaje.set('Pesaje registrado');
        this.peso.set(null);
        this.guardando.set(false);
        this.actualizarTodo();
      },
      error: (r) => {
        this.mensaje.set(r?.error?.mensaje ?? 'No se pudo registrar');
        this.guardando.set(false);
      },
    });
  }

  /** Registra una vacuna. */
  registrarVacuna() {
    if (!this.nombreVacuna() || this.guardando()) return;

    this.guardando.set(true);
    const hoy = new Date().toISOString().slice(0, 10);

    this.api
      .registrarVacuna(this.idAnimal, {
        nombre: this.nombreVacuna(),
        fecha: hoy,
        proxima_fecha: this.proximaVacuna() || undefined,
      })
      .subscribe({
        next: () => {
          this.mensaje.set('Vacuna registrada');
          this.nombreVacuna.set('');
          this.proximaVacuna.set('');
          this.guardando.set(false);
          this.actualizarTodo();
        },
        error: (r) => {
          this.mensaje.set(r?.error?.mensaje ?? 'No se pudo registrar');
          this.guardando.set(false);
        },
      });
  }

  /** Vuelve a pedir la ficha completa (tras registrar algo). */
  private actualizarTodo() {
    this.cargarFicha();
  }

  /** Clase de la insignia del Índice. */
  claseIndice(indice: EstadoIndice): string {
    if (indice === 'ATENCION') return 'badge-peligro';
    if (indice === 'OBSERVACION') return 'badge-alerta';
    return 'badge-exito';
  }

  /** Etiqueta legible del Índice. */
  textoIndice(indice: EstadoIndice): string {
    if (indice === 'ATENCION') return 'Requiere atención';
    if (indice === 'OBSERVACION') return 'Requiere observación';
    return 'Óptimo';
  }

  /**
   * Porcentaje "de salud" para el círculo del Índice.
   * Es un dato visual: los animales en observación 60% y los que
   * requieren atención 25%. NO es un valor veterinario.
   */
  porcentajeIndice(indice: EstadoIndice): number {
    if (indice === 'ATENCION') return 25;
    if (indice === 'OBSERVACION') return 60;
    return 95;
  }

  /** Edad del animal a partir de su fecha de nacimiento. */
  edad(fechaNacimiento: string | null): string {
    if (!fechaNacimiento) return 'Sin dato';

    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

    let años = hoy.getFullYear() - nacimiento.getFullYear();
    const meses = hoy.getMonth() - nacimiento.getMonth();

    if (meses < 0) años--;

    return años > 0 ? `${años} años` : `${Math.max(0, meses)} meses`;
  }

  /** Formatea una fecha. */
  formatearFecha(valor: string | null): string {
    if (!valor) return '-';

    return new Date(valor).toLocaleDateString('es-MX');
  }
}
