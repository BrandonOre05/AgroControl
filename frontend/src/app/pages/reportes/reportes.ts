// ============================================================
// pages/reportes/reportes.ts
// Pantalla de reportes: tarjetas para ver y descargar (CSV) cada
// reporte del sistema.
//
// El PDF se obtiene con el botón "Imprimir": el navegador abre su
// diálogo para guardar como PDF, sin instalar librerías.
// ============================================================

import { DatePipe, NgIf, NgFor } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Reporte } from '../../core/models';
import { IconoComponent } from '../../shared/icono';

@Component({
  selector: 'app-reportes',
  imports: [IconoComponent, DatePipe, NgIf, NgFor],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class ReportesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  readonly reportes = signal<{ tipo: string; titulo: string; icono: string }[]>([]);
  readonly error = signal('');

  /** Reporte abierto para ver en pantalla. */
  readonly abierto = signal<Reporte | null>(null);
  readonly cargandoReporte = signal(false);

  readonly puedeExportar = () => this.auth.puede('reportes', 'exportar');

  ngOnInit() {
    this.api.listarReportes().subscribe({
      next: (r) => this.reportes.set(r.reportes),
      error: (e) => this.error.set(e?.error?.mensaje ?? 'No se pudieron cargar los reportes'),
    });
  }

  /** Abre un reporte en una ventana para verlo (e imprimirlo). */
  ver(tipo: string) {
    this.cargandoReporte.set(true);

    this.api.obtenerReporte(tipo).subscribe({
      next: (reporte) => {
        this.abierto.set(reporte);
        this.cargandoReporte.set(false);
      },
      error: (r) => {
        this.cargandoReporte.set(false);
        this.error.set(r?.error?.mensaje ?? 'No se pudo generar el reporte');
      },
    });
  }

  /**
   * Descarga el reporte en CSV.
   * Se hace con un enlace temporal para que el navegador lo baje.
   */
  descargar(tipo: string) {
    const url = `${this.baseUrl()}/reportes/${tipo}/csv`;
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = '';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  }

  /** Abre el reporte en una pestaña nueva, listo para imprimir. */
  imprimir(tipo: string) {
    const ventana = window.open('', '_blank');

    if (!ventana) {
      this.error.set('El navegador bloqueó la ventana de impresión');
      return;
    }

    this.api.obtenerReporte(tipo).subscribe({
      next: (reporte) => {
        const filas = reporte.filas
          .map((fila) => {
            const celdas = reporte.columnas
              .map((columna) => `<td>${fila[columna] ?? ''}</td>`)
              .join('');
            return `<tr>${celdas}</tr>`;
          })
          .join('');

        ventana.document.write(`
          <html lang="es">
            <head>
              <title>${reporte.titulo}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
                h1 { font-size: 18px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
                th { background: #eee; }
                .pie { font-size: 11px; color: #666; margin-top: 12px; }
              </style>
            </head>
            <body>
              <h1>${reporte.titulo}</h1>
              <table>
                <thead><tr>${reporte.columnas.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
                <tbody>${filas}</tbody>
              </table>
              <p class="pie">AgroControl · Generado el ${new Date().toLocaleString('es-MX')}</p>
            </body>
          </html>
        `);
        ventana.document.close();
        ventana.print();
      },
      error: () => ventana.close(),
    });
  }

  /** URL base de la API (para las descargas). */
  private baseUrl(): string {
    return location.origin.replace('4200', '3000') + '/api';
  }
}
