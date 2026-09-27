// ============================================================
// scripts/crearFinca.ts
// Registra la finca principal del sistema.
//
// Uso:
//   pnpm run crear-finca "Finca La Esperanza" "Zona Norte" 5.5
//   (nombre, ubicación y extensión en hectáreas son opcionales)
//
// También se puede crear desde la API: POST /api/finca (solo ADMIN).
// ============================================================

import { testConnection } from '../database/Conexion';
import { fincaService } from '../services/FincaService';

async function main() {
  const [nombre, ubicacion, extension] = process.argv.slice(2);

  if (!nombre) {
    console.log('Uso: pnpm run crear-finca "Nombre" ["Ubicación"] [extensión_en_hectáreas]');
    process.exit(1);
  }

  await testConnection();

  try {
    const finca = await fincaService.crear({
      nombre,
      ubicacion,
      // La extensión llega como texto, la convertimos a número
      extension: extension ? Number(extension) : undefined,
      tipo_produccion: 'MIXTA',
    });

    console.log('Finca creada correctamente:');
    console.log(`  id:     ${finca.id_finca}`);
    console.log(`  nombre: ${finca.nombre}`);
    console.log('Ya puedes registrar animales en POST /api/animales');
  } catch (error) {
    // `error` puede ser cualquier cosa, por eso comprobamos su tipo
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('Error al crear la finca:', mensaje);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Error inesperado:', error);
  process.exit(1);
});
