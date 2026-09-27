// ============================================================
// pages/inventario/inventario.ts
// Pantalla de inventario: tarjetas de resumen, tabla de productos
// y registro de entradas/salidas de stock.
// ============================================================

import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Movimiento, Producto, ResumenInventario } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-inventario',
  imports: [FormsModule, IconoComponent, NgIf, NgFor],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class InventarioComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly productos = signal<Producto[]>([]);
  readonly resumen = signal<ResumenInventario | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly mensaje = signal('');

  readonly texto = signal('');
  readonly categoria = signal('');

  readonly puedeEditar = () => this.auth.puede('inventario', 'crear');
  readonly puedeMover = () => this.auth.puede('inventario', 'registrar_movimiento');

  // --- Modal de nuevo producto ---
  readonly modalProducto = signal(false);
  readonly nombre = signal('');
  readonly catProducto = signal('ALIMENTO');
  readonly unidad = signal('');
  readonly stockInicial = signal<number | null>(null);
  readonly stockMinimo = signal<number | null>(null);
  readonly fechaVencimiento = signal('');
  readonly guardando = signal(false);

  // --- Modal de movimiento ---
  readonly productoElegido = signal<Producto | null>(null);
  readonly tipoMovimiento = signal<'ENTRADA' | 'SALIDA'>('ENTRADA');
  readonly cantidadMovimiento = signal<number | null>(null);
  readonly motivoMovimiento = signal('');
  readonly movimientos = signal<Movimiento[]>([]);

  ngOnInit() {
    this.cargar();
  }

  /** Descarga productos y resumen. */
  cargar() {
    this.cargando.set(true);

    const filtros: Record<string, string> = {};
    if (this.texto()) filtros['texto'] = this.texto();
    if (this.categoria()) filtros['categoria'] = this.categoria();

    this.api.listarProductos(filtros).subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: (r) => {
        this.error.set(r?.error?.mensaje ?? 'No se pudo cargar el inventario');
        this.cargando.set(false);
      },
    });

    this.api.resumenInventario().subscribe({
      next: (resumen) => this.resumen.set(resumen),
      error: () => {},
    });
  }

  // ---------- Producto nuevo ----------

  abrirProducto() {
    this.nombre.set('');
    this.catProducto.set('ALIMENTO');
    this.unidad.set('');
    this.stockInicial.set(null);
    this.stockMinimo.set(null);
    this.fechaVencimiento.set('');
    this.modalProducto.set(true);
  }

  guardarProducto() {
    if (this.guardando()) return;
    this.guardando.set(true);

    this.api
      .crearProducto({
        nombre: this.nombre(),
        categoria: this.catProducto(),
        unidad: this.unidad(),
        stock_actual: this.stockInicial() ?? 0,
        stock_minimo: this.stockMinimo() ?? 0,
        fecha_vencimiento: this.fechaVencimiento() || undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalProducto.set(false);
          this.mensaje.set('Producto registrado');
          this.cargar();
        },
        error: (r) => {
          this.guardando.set(false);
          this.mensaje.set(r?.error?.mensaje ?? 'No se pudo guardar');
        },
      });
  }

  // ---------- Movimientos ----------

  /** Abre el modal de entrada/salida de un producto. */
  registrar(producto: Producto, tipo: 'ENTRADA' | 'SALIDA') {
    this.productoElegido.set(producto);
    this.tipoMovimiento.set(tipo);
    this.cantidadMovimiento.set(null);
    this.motivoMovimiento.set('');
    this.mensaje.set('');

    // Cargamos el historial de movimientos del producto
    this.api.movimientosProducto(producto.id_producto).subscribe({
      next: (movimientos) => this.movimientos.set(movimientos),
      error: () => this.movimientos.set([]),
    });
  }

  confirmarMovimiento() {
    const producto = this.productoElegido();
    if (!producto || this.guardando()) return;

    this.guardando.set(true);

    this.api
      .registrarMovimiento(producto.id_producto, {
        tipo: this.tipoMovimiento(),
        cantidad: this.cantidadMovimiento(),
        motivo: this.motivoMovimiento() || undefined,
      })
      .subscribe({
        next: (r) => {
          this.guardando.set(false);
          this.productoElegido.set(null);
          this.mensaje.set(
            `${this.tipoMovimiento() === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada. Stock actual: ${r.stock_nuevo}`,
          );
          this.cargar();
        },
        error: (r) => {
          this.guardando.set(false);
          this.mensaje.set(r?.error?.mensaje ?? 'No se pudo registrar el movimiento');
        },
      });
  }

  // ---------- Utilidades ----------

  /** Clase de la insignia de estado del producto. */
  claseEstado(estado: string): string {
    if (estado === 'DISPONIBLE') return 'badge-exito';
    if (estado === 'BAJO') return 'badge-alerta';
    return 'badge-peligro';
  }

  /** Etiqueta legible de la categoría. */
  textoCategoria(categoria: string): string {
    return categoria.charAt(0) + categoria.slice(1).toLowerCase();
  }

  fecha(valor: string | null): string {
    if (!valor) return '-';
    return new Date(valor).toLocaleDateString('es-MX');
  }
}
