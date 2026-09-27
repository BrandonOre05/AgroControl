// ============================================================
// services/AlertaService.ts
// Lógica del sistema de alertas.
//
// ¿Cómo funciona? No hay tareas programadas: las alertas se
// CALCULAN en el momento (al iniciar sesión, al abrir el panel o
// cuando alguien lo pide) y se guardan en la tabla Alerta para que
// el usuario pueda resolverlas o ignorarlas.
//
// El recálculo es "sincronización":
//   1. Se detectan los problemas actuales (candidatas).
//   2. Las que no existían se crean.
//   3. Las que ya no aplican se resuelven automáticamente.
//   4. Si un problema empeora (de advertencia a crítica), se
//      actualiza la severidad.
// ============================================================

import { Alerta, AlertaCandidata, FiltrosAlerta } from '../models/Alerta';
import { alertaRepository } from '../repositories/AlertaRepository';
import { AppError } from '../utils/AppError';
import { fincaService } from './FincaService';

/** Días de anticipación para avisar de algo "próximo". */
export const DIAS_AVISO = 15;

export class AlertaService {
  /** Lista las alertas de la finca con filtros opcionales. */
  async listar(filtros: FiltrosAlerta = {}): Promise<Alerta[]> {
    const idFinca = await fincaService.obtenerId();
    return alertaRepository.findAll(idFinca, filtros);
  }

  /**
   * Marca una alerta como resuelta o ignorada (a mano, por un usuario).
   * Solo el usuario que resolvió queda registrado.
   */
  async cambiarEstado(
    id: number,
    estado: 'RESUELTA' | 'IGNORADA',
    idUsuario: number
  ): Promise<Alerta> {
    const alerta = await alertaRepository.findById(id);

    if (!alerta) {
      throw new AppError('Alerta no encontrada', 404);
    }

    await alertaRepository.cambiarEstado(id, estado, idUsuario);

    return (await alertaRepository.findById(id))!;
  }

  /**
   * Recalcula todas las alertas de la finca y las sincroniza.
   * Devuelve un resumen de lo que cambió.
   */
  async sincronizar(): Promise<{
    creadas: number;
    resueltas: number;
    actualizadas: number;
    activas: number;
  }> {
    const idFinca = await fincaService.obtenerId();

    // 1. Detectar los problemas del momento
    const candidatas = await this.detectar(idFinca);

    // 2. Traer las alertas que ya están activas
    const activas = await alertaRepository.activas(idFinca);

    // Diccionario clave -> alerta activa
    const mapa = new Map<string, (typeof activas)[number]>();
    for (const alerta of activas) {
      mapa.set(this.clave(alerta.tipo, alerta.id_animal, alerta.id_producto, alerta.id_cultivo, alerta.id_actividad), alerta);
    }

    let creadas = 0;
    let actualizadas = 0;
    const clavesVigentes = new Set<string>();

    // 3. Crear las nuevas y actualizar la severidad si cambió
    for (const candidata of candidatas) {
      clavesVigentes.add(candidata.clave);
      const existente = mapa.get(candidata.clave);

      if (!existente) {
        await alertaRepository.create(idFinca, candidata);
        creadas++;
      } else if (existente.severidad !== candidata.severidad) {
        await alertaRepository.actualizarSeveridad(existente.id_alerta, candidata.severidad);
        actualizadas++;
      }
    }

    // 4. Resolver automáticamente las que ya no aplican
    const aResolver = activas
      .filter((alerta) => !clavesVigentes.has(this.clave(
        alerta.tipo, alerta.id_animal, alerta.id_producto, alerta.id_cultivo, alerta.id_actividad
      )))
      .map((alerta) => alerta.id_alerta);

    const resueltas = await alertaRepository.resolverAutomaticamente(aResolver);

    const restantes = await alertaRepository.activas(idFinca);

    return {
      creadas,
      resueltas,
      actualizadas,
      activas: restantes.length,
    };
  }

  /** Construye la lista de alertas candidatas del momento. */
  private async detectar(idFinca: number): Promise<AlertaCandidata[]> {
    const candidatas: AlertaCandidata[] = [];

    // --- Vacunas vencidas o próximas ---
    const vacunas = await alertaRepository.vacunasPorVencer(idFinca, DIAS_AVISO);
    for (const v of vacunas) {
      const vencido = v.dias < 0;
      const quien = `${v.codigo}${v.nombre_animal ? ` (${v.nombre_animal})` : ''}`;
      candidatas.push({
        tipo: 'VACUNA_PROXIMA',
        severidad: vencido ? 'CRITICA' : 'ADVERTENCIA',
        mensaje: vencido
          ? `Vacuna "${v.nombre_vacuna}" vencida hace ${Math.abs(v.dias)} día(s) en ${quien}.`
          : `Vacuna "${v.nombre_vacuna}" de ${quien} vence en ${v.dias} día(s).`,
        id_animal: v.id_animal,
        clave: `VACUNA_PROXIMA|${v.id_animal}|0|0|0`,
      });
    }

    // --- Controles vencidos o próximos ---
    const controles = await alertaRepository.controlesPorVencer(idFinca, DIAS_AVISO);
    for (const c of controles) {
      const vencido = c.dias < 0;
      const quien = `${c.codigo}${c.nombre_animal ? ` (${c.nombre_animal})` : ''}`;
      candidatas.push({
        tipo: 'CONTROL_PENDIENTE',
        severidad: vencido ? 'CRITICA' : 'ADVERTENCIA',
        mensaje: vencido
          ? `Control "${c.tipo}" vencido hace ${Math.abs(c.dias)} día(s) en ${quien}.`
          : `Control "${c.tipo}" de ${quien} vence en ${c.dias} día(s).`,
        id_animal: c.id_animal,
        clave: `CONTROL_PENDIENTE|${c.id_animal}|0|0|0`,
      });
    }

    // --- Tratamientos que terminan pronto o ya terminaron ---
    const tratamientos = await alertaRepository.tratamientosPorVencer(idFinca, DIAS_AVISO);
    for (const t of tratamientos) {
      const vencido = t.dias < 0;
      const quien = `${t.codigo}${t.nombre_animal ? ` (${t.nombre_animal})` : ''}`;
      candidatas.push({
        tipo: 'TRATAMIENTO_PENDIENTE',
        severidad: vencido ? 'CRITICA' : 'ADVERTENCIA',
        mensaje: vencido
          ? `El tratamiento "${t.nombre_tratamiento}" de ${quien} terminó hace ${Math.abs(t.dias)} día(s) y sigue registrado.`
          : `El tratamiento "${t.nombre_tratamiento}" de ${quien} termina en ${t.dias} día(s).`,
        id_animal: t.id_animal,
        clave: `TRATAMIENTO_PENDIENTE|${t.id_animal}|0|0|0`,
      });
    }

    // --- Inventario bajo ---
    const productos = await alertaRepository.productosStockBajo(idFinca);
    for (const p of productos) {
      const agotado = Number(p.stock_actual) === 0;
      candidatas.push({
        tipo: 'INVENTARIO_BAJO',
        severidad: agotado ? 'CRITICA' : 'ADVERTENCIA',
        mensaje: agotado
          ? `El producto "${p.nombre}" está AGOTADO (0 ${p.unidad}).`
          : `El producto "${p.nombre}" tiene poco stock: ${p.stock_actual} de mínimo ${p.stock_minimo} ${p.unidad}.`,
        id_producto: p.id_producto,
        clave: `INVENTARIO_BAJO|0|${p.id_producto}|0|0`,
      });
    }

    // --- Actividades pendientes cuya fecha ya llegó ---
    const actividades = await alertaRepository.actividadesPendientes(idFinca);
    for (const a of actividades) {
      candidatas.push({
        tipo: 'ACTIVIDAD_PENDIENTE',
        severidad: 'INFORMATIVA',
        mensaje: `La actividad "${a.nombre}" sigue pendiente (fecha: ${a.fecha}).`,
        id_actividad: a.id_actividad,
        clave: `ACTIVIDAD_PENDIENTE|0|0|0|${a.id_actividad}`,
      });
    }

    // --- Cosechas próximas ---
    const cosechas = await alertaRepository.cosechasProximas(idFinca, DIAS_AVISO);
    for (const c of cosechas) {
      candidatas.push({
        tipo: 'COSECHA_PROXIMA',
        severidad: 'INFORMATIVA',
        mensaje: `El cultivo "${c.nombre}" tiene cosecha estimada en ${c.dias} día(s).`,
        id_cultivo: c.id_cultivo,
        clave: `COSECHA_PROXIMA|0|0|${c.id_cultivo}|0`,
      });
    }

    // --- Animales que requieren observación o atención ---
    const animales = await alertaRepository.animalesConAlerta(idFinca);
    for (const a of animales) {
      const grave = a.estado_indice === 'ATENCION';
      const quien = `${a.codigo}${a.nombre ? ` (${a.nombre})` : ''}`;
      candidatas.push({
        tipo: 'ANIMAL_OBSERVACION',
        severidad: grave ? 'CRITICA' : 'ADVERTENCIA',
        mensaje: grave
          ? `El animal ${quien} REQUIERE ATENCIÓN según el Índice de Estado.`
          : `El animal ${quien} requiere observación según el Índice de Estado.`,
        id_animal: a.id_animal,
        clave: `ANIMAL_OBSERVACION|${a.id_animal}|0|0|0`,
      });
    }

    return candidatas;
  }

  /** Arma la clave única de una alerta (tipo + referencia). */
  private clave(
    tipo: string,
    idAnimal: number | null,
    idProducto: number | null,
    idCultivo: number | null,
    idActividad: number | null
  ): string {
    return `${tipo}|${idAnimal ?? 0}|${idProducto ?? 0}|${idCultivo ?? 0}|${idActividad ?? 0}`;
  }
}

export const alertaService = new AlertaService();
