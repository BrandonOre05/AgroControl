// ============================================================
// scripts/datosDemo2.ts
// Datos de ejemplo para inventario, producción y actividades.
// Es SEGURO: si ya hay productos, no inserta nada.
//
// Uso: pnpm run datos-demo-2
// ============================================================

import { testConnection } from '../database/Conexion';
import { actividadRepository } from '../repositories/ActividadRepository';
import { animalRepository } from '../repositories/AnimalRepository';
import { cultivoRepository } from '../repositories/CultivoRepository';
import { inventarioRepository } from '../repositories/InventarioRepository';
import { produccionRepository } from '../repositories/ProduccionRepository';
import { fincaService } from '../services/FincaService';

/** Fecha con desplazamiento en días respecto a hoy. */
function dias(offset: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + offset);
  return fecha.toISOString().slice(0, 10);
}

async function main() {
  await testConnection();
  const idFinca = await fincaService.obtenerId();

  // ---------- INVENTARIO ----------
  const productos = await inventarioRepository.findAll(idFinca);

  if (productos.length === 0) {
    const catalogo = [
      { nombre: 'Alimento balanceado 14%', categoria: 'ALIMENTO', unidad: 'saco', stock_actual: 0, stock_minimo: 20 },
      { nombre: 'Pasto fresco', categoria: 'ALIMENTO', unidad: 'kg', stock_actual: 0, stock_minimo: 200 },
      { nombre: 'Desparasitante Ivermectina', categoria: 'MEDICAMENTO', unidad: 'ml', stock_actual: 0, stock_minimo: 50 },
      { nombre: 'Antibiótico penicilina', categoria: 'MEDICAMENTO', unidad: 'frasco', stock_actual: 0, stock_minimo: 10 },
      { nombre: 'Vacuna Aftosa', categoria: 'VACUNA', unidad: 'dosis', stock_actual: 0, stock_minimo: 25 },
      { nombre: 'Fertilizante NPK', categoria: 'FERTILIZANTE', unidad: 'kg', stock_actual: 0, stock_minimo: 100 },
      { nombre: 'Semilla de maíz híbrido', categoria: 'SEMILLA', unidad: 'kg', stock_actual: 0, stock_minimo: 15 },
      { nombre: 'Semilla de frijol', categoria: 'SEMILLA', unidad: 'kg', stock_actual: 0, stock_minimo: 10 },
      { nombre: 'Guadaña', categoria: 'HERRAMIENTA', unidad: 'pieza', stock_actual: 4, stock_minimo: 1 },
    ] as const;

    for (const p of catalogo) {
      const id = await inventarioRepository.create(
        {
          nombre: p.nombre,
          categoria: p.categoria,
          unidad: p.unidad,
          stock_actual: 0,
          stock_minimo: p.stock_minimo,
        },
        idFinca,
        1
      );

      // Entrada inicial: deja varios en nivel bajo para que se vean las alertas
      const cantidad = p.stock_actual > 0 ? p.stock_actual : p.stock_minimo + 5;
      await inventarioRepository.registrarMovimiento(
        id,
        { tipo: 'ENTRADA', cantidad, motivo: 'Compra inicial' },
        1
      );
    }

    console.log(`Productos de ejemplo creados: ${catalogo.length}`);
  } else {
    console.log(`Inventario ya tiene ${productos.length} producto(s).`);
  }

  // ---------- PRODUCCIÓN ----------
  const animales = (await animalRepository.findAll(idFinca)).filter((a) => a.estado_animal === 'ACTIVO');

  if (animales.length > 0) {
    for (const animal of animales) {
      for (let i = 1; i <= 5; i++) {
        await produccionRepository.createGanadera(
          {
            id_animal: animal.id_animal,
            tipo: 'LECHE',
            cantidad: 12 + Math.round(Math.random() * 8),
            unidad: 'litros',
            fecha: dias(-i),
          },
          1
        );
      }
    }
    console.log(`Registros de leche creados: ${animales.length * 5}`);
  }

  // Cosechas de los cultivos
  const cultivos = (await cultivoRepository.findAll(idFinca, { etapa: 'COSECHA' }));

  if (cultivos.length > 0) {
    for (const cultivo of cultivos) {
      await produccionRepository.createAgricola(
        {
          id_cultivo: cultivo.id_cultivo,
          producto: cultivo.nombre,
          cantidad: 850,
          unidad: 'kg',
          fecha_cosecha: dias(-2),
        },
        1
      );
    }
    console.log(`Cosechas registradas: ${cultivos.length}`);
  }

  // ---------- ACTIVIDADES ----------
  const tareas = [
    { nombre: 'Revisar bebederos del potrero 1', tipo: 'GANADERA', estado: 'PENDIENTE', fecha: dias(0) },
    { nombre: 'Aplicar fertilizante en lote norte', tipo: 'AGRICOLA', estado: 'EN_PROCESO', fecha: dias(0) },
    { nombre: 'Limpiar y desinfectar corral', tipo: 'MANTENIMIENTO', estado: 'COMPLETADA', fecha: dias(-1) },
    { nombre: 'Actualizar registro de Chapada', tipo: 'ADMINISTRATIVA', estado: 'PENDIENTE', fecha: dias(1) },
    { nombre: 'Cosechar/parcar el potrero 3', tipo: 'GANADERA', estado: 'PENDIENTE', fecha: dias(2) },
    { nombre: 'Revisar el sistema de riego', tipo: 'AGRICOLA', estado: 'CANCELADA', fecha: dias(-2) },
  ] as const;

  let creadas = 0;

  for (const tarea of tareas) {
    const existe = (await actividadRepository.findAll(idFinca)).some(
      (a) => a.nombre === tarea.nombre
    );

    if (existe) continue;

    await actividadRepository.create(
      { nombre: tarea.nombre, tipo: tarea.tipo, fecha: tarea.fecha },
      idFinca
    );

    await actividadRepository.cambiarEstado(
      (await actividadRepository.findAll(idFinca)).find((a) => a.nombre === tarea.nombre)!.id_actividad,
      tarea.estado
    );

    creadas++;
  }

  console.log(`Actividades creadas: ${creadas}`);
  process.exit(0);
}

main().catch((error) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.error('Error al cargar datos de ejemplo:', mensaje);
  process.exit(1);
});
