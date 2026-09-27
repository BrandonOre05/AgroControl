// ============================================================
// scripts/datosDemo.ts
// Carga cultivos y actividades de ejemplo para poder ver las
// pantallas con datos mientras se desarrolla.
//
// Es SEGURO: si ya hay cultivos, no inserta nada.
//
// Uso: pnpm run datos-demo
// ============================================================

import { testConnection } from '../database/Conexion';
import { cultivoRepository } from '../repositories/CultivoRepository';
import { fincaService } from '../services/FincaService';

/** Cultivos de ejemplo, con fechas calculadas desde hoy. */
function dias(offset: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + offset);
  return fecha.toISOString().slice(0, 10);
}

async function main() {
  await testConnection();

  const idFinca = await fincaService.obtenerId();

  // Si ya hay cultivos, no hacemos nada
  const existentes = await cultivoRepository.findAll(idFinca);
  if (existentes.length > 0) {
    console.log(`Ya hay ${existentes.length} cultivo(s) registrados. No se agrega nada.`);
    process.exit(0);
  }

  const cultivos = [
    {
      nombre: 'Maíz',
      tipo: 'Maíz dulce',
      area: 1.2,
      fecha_siembra: dias(-70),
      fecha_cosecha_estimada: dias(20),
      ubicacion: 'Lote Norte',
    },
    {
      nombre: 'Tomate',
      tipo: 'Tomate perita',
      area: 0.8,
      fecha_siembra: dias(-50),
      fecha_cosecha_estimada: dias(9),
      ubicacion: 'Invernadero 1',
    },
    {
      nombre: 'Trigo',
      tipo: 'Trigo de invierno',
      area: 2.5,
      fecha_siembra: dias(-120),
      fecha_cosecha_estimada: dias(75),
      ubicacion: 'Lote Sur',
    },
    {
      nombre: 'Frijol',
      tipo: 'Frijol negro',
      area: 1.0,
      fecha_siembra: dias(-35),
      fecha_cosecha_estimada: dias(40),
      ubicacion: 'Lote Este',
    },
    {
      nombre: 'Aguacate',
      tipo: 'Aguacate criollo',
      area: 1.8,
      fecha_siembra: dias(-400),
      fecha_cosecha_estimada: dias(200),
      ubicacion: 'Bosque de frutales',
    },
    {
      nombre: 'Cebolla',
      tipo: 'Cebolla blanca',
      area: 0.6,
      fecha_siembra: dias(-25),
      fecha_cosecha_estimada: dias(55),
      ubicacion: 'Lote Centro',
    },
  ];

  const etapas = [
    'CRECIMIENTO',
    'MANTENIMIENTO',
    'CRECIMIENTO',
    'SIEMBRA',
    'COSECHA',
    'SIEMBRA',
  ] as const;

  const ids: number[] = [];

  for (let i = 0; i < cultivos.length; i++) {
    const id = await cultivoRepository.create(cultivos[i], idFinca, 1, 1);
    await cultivoRepository.cambiarEtapa(id, etapas[i]);
    ids.push(id);
  }

  // Algunas actividades agrícolas de ejemplo
  const actividades = [
    { cultivo: 0, tipo: 'RIEGO', descripcion: 'Riego por surco, 2 horas', estado: 'COMPLETADA' },
    { cultivo: 0, tipo: 'FERTILIZACION', descripcion: 'Aplicación de fertilizante nitrogenado', estado: 'COMPLETADA' },
    { cultivo: 1, tipo: 'CONTROL_PLAGAS', descripcion: 'Control preventivo de plaga en tomate', estado: 'EN_PROCESO' },
    { cultivo: 2, tipo: 'MANTENIMIENTO', descripcion: 'Desmale manual del trigo', estado: 'COMPLETADA' },
    { cultivo: 3, tipo: 'SIEMBRA', descripcion: 'Siembra de frijol en surcos', estado: 'COMPLETADA' },
    { cultivo: 4, tipo: 'COSECHA', descripcion: 'Recolección de aguacate temporada', estado: 'PENDIENTE' },
  ] as const;

  for (const actividad of actividades) {
    const idCultivo = ids[actividad.cultivo];
    if (!idCultivo) continue;

    await cultivoRepository.createActividad(
      {
        fecha: dias(-3),
        tipo: actividad.tipo,
        descripcion: actividad.descripcion,
        estado: actividad.estado,
      },
      idCultivo,
      1
    );
  }

  console.log(`Cultivos de ejemplo creados: ${ids.length}`);
  console.log(`Actividades agrícolas creadas: ${actividades.length}`);
  console.log('Ya puedes ver la pantalla de Cultivos con datos.');

  process.exit(0);
}

main().catch((error) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.error('Error al cargar los datos de ejemplo:', mensaje);
  process.exit(1);
});
