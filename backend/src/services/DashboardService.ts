// ============================================================
// services/DashboardService.ts
// Arma el resumen del panel de control.
//
// Antes de devolver los datos, sincroniza las alertas para que el
// panel muestre información al día. Así el usuario no tiene que
// esperar a que otro proceso genere las alertas.
// ============================================================

import { Conteo, ResumenDashboard } from '../models/Dashboard';
import { alertaRepository } from '../repositories/AlertaRepository';
import { dashboardRepository } from '../repositories/DashboardRepository';
import { alertaService } from './AlertaService';
import { fincaService } from './FincaService';

/** Días hacia adelante para los "próximos". */
const DIAS_PRORROGA = 30;
const DIAS_AVISO_COSECHA = 15;

export class DashboardService {
  /** Genera el resumen completo del panel. */
  async obtenerResumen(): Promise<ResumenDashboard> {
    const idFinca = await fincaService.obtenerId();

    // Las alertas se refrescan antes de contarlas
    await alertaService.sincronizar();

    // Consultas en paralelo: así es más rápido que una por una
    const [
      totalAnimales,
      porIndice,
      porEstado,
      porEspecie,
      cultivos,
      cosechasProximas,
      leche,
      cosechas,
      inventario,
      actividadesPendientes,
      controlesProximos,
      alertasSeveridad,
    ] = await Promise.all([
      dashboardRepository.totalAnimales(idFinca),
      dashboardRepository.animalesPorIndice(idFinca),
      dashboardRepository.animalesPorEstado(idFinca),
      dashboardRepository.animalesPorEspecie(idFinca),
      dashboardRepository.cultivos(idFinca),
      dashboardRepository.cosechasProximas(idFinca, DIAS_AVISO_COSECHA),
      dashboardRepository.lecheUltimos30Dias(idFinca),
      dashboardRepository.cosechasUltimos30Dias(idFinca),
      dashboardRepository.inventario(idFinca),
      dashboardRepository.actividadesPendientes(idFinca),
      dashboardRepository.controlesProximos(idFinca, DIAS_PRORROGA),
      alertaRepository.contarPorSeveridad(idFinca),
    ]);

    // Total de alertas activas
    const totalAlertas = alertasSeveridad.reduce((suma, a) => suma + a.cantidad, 0);

    // Nos aseguramos de que existan los tres niveles (para el frontend)
    const porSeveridad: Conteo[] = [
      { etiqueta: 'CRITICA', cantidad: 0 },
      { etiqueta: 'ADVERTENCIA', cantidad: 0 },
      { etiqueta: 'INFORMATIVA', cantidad: 0 },
    ];

    for (const nivel of alertasSeveridad) {
      const found = porSeveridad.find((p) => p.etiqueta === nivel.severidad);
      if (found) found.cantidad = nivel.cantidad;
    }

    return {
      generado_en: new Date().toISOString(),
      animales: {
        total: totalAnimales,
        por_indice: porIndice,
        por_estado: porEstado,
        por_especie: porEspecie,
      },
      cultivos: {
        total_activos: cultivos.total_activos,
        por_etapa: cultivos.por_etapa,
        cosechas_proximas: cosechasProximas,
      },
      produccion: {
        leche_ultimos_30_dias: leche,
        cosechas_ultimos_30_dias: cosechas,
      },
      inventario,
      actividades_pendientes: actividadesPendientes,
      controles_proximos_30_dias: controlesProximos,
      alertas: {
        total: totalAlertas,
        por_severidad: porSeveridad,
      },
    };
  }
}

export const dashboardService = new DashboardService();
