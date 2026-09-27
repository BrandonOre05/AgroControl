// ============================================================
// shared/pipes/tiempo-relativo.pipe.ts
// PIPE PERSONALIZADO: convierte una fecha en texto legible.
//
//   {{ '2026-09-20T10:00:00Z' | tiempoRelativo }}  ->  "hace 6 días"
//   {{ 'hace 5 minutos' }}
//
// ¿Por qué un pipe? Porque el formato se repite en varias pantallas
// (historial, alertas, producción). Un pipe se escribe UNA vez y se
// reutiliza en todas: eso es la ventaja frente a una función suelta.
//
// Los pipes son PÚBLICOS por defecto y se usan dentro de una
// interpolación {{ }} o de un binding [propiedad].
// ============================================================

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tiempoRelativo',
})
export class TiempoRelativoPipe implements PipeTransform {
  /**
   * @param valor  la fecha que queremos mostrar
   * @returns      texto como "hace 3 días", "en 2 horas", "hoy", etc.
   */
  transform(valor: string | Date | null | undefined): string {
    // Si no hay fecha, no hay nada que mostrar
    if (!valor) return 'sin registro';

    const fecha = valor instanceof Date ? valor : new Date(valor);

    // Si la fecha no es válida, se muestra tal cual
    if (isNaN(fecha.getTime())) return 'fecha inválida';

    const minutos = Math.round((Date.now() - fecha.getTime()) / 60000);

    // La fecha es futura (un control programado, por ejemplo)
    if (minutos < 0) {
      const faltan = Math.abs(minutos);

      if (faltan < 60) return `en ${faltan} min`;
      if (faltan < 1440) return `en ${Math.round(faltan / 60)} h`;

      return `en ${Math.round(faltan / 1440)} días`;
    }

    // La fecha ya pasó
    if (minutos < 1) return 'hace un momento';
    if (minutos < 60) return `hace ${minutos} min`;

    const horas = Math.round(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;

    const dias = Math.round(horas / 24);
    if (dias < 30) return `hace ${dias} días`;

    const meses = Math.round(dias / 30);
    if (meses < 12) return `hace ${meses} meses`;

    return `hace ${Math.round(meses / 12)} años`;
  }
}
