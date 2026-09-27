// ============================================================
// scripts/crearAdmin.ts
// Crea el usuario administrador inicial del sistema.
//
// ¿Por qué un script y no un endpoint? Porque el endpoint para crear
// usuarios es solo para ADMIN... y el primer usuario DEBE ser admin.
// Es un arranque, no una operación del día a día.
//
// Uso:
//   pnpm run crear-admin "Nombre" "correo@dominio.com" "Contraseña1"
// ============================================================

import bcrypt from 'bcryptjs';
import { testConnection } from '../database/Conexion';
import { usuarioRepository } from '../repositories/UsuarioRepository';
import { COSTO_BCRYPT } from '../services/AuthService';
import { crearUsuarioSchema } from '../validators/AuthValidators';
import { validar } from '../utils/validacion';

async function main() {
  // Los datos llegan por argumentos de la línea de comandos
  const [nombre, correo, password] = process.argv.slice(2);

  if (!nombre || !correo || !password) {
    console.log('Uso: pnpm run crear-admin "Nombre" "correo@dominio.com" "Contraseña1"');
    process.exit(1);
  }

  // Se validan con el mismo esquema que usará la API
  const datos = validar(crearUsuarioSchema, {
    nombre,
    correo,
    password,
    rol: 'ADMIN', // El primer usuario siempre es administrador
  });

  await testConnection();

  // ¿El correo ya está registrado?
  const existente = await usuarioRepository.findByCorreo(datos.correo);
  if (existente) {
    console.log(`El correo ${datos.correo} ya está registrado.`);
    process.exit(1);
  }

  // Ciframos la contraseña: nunca se guarda en texto plano
  const hash = await bcrypt.hash(datos.password, COSTO_BCRYPT);

  const id = await usuarioRepository.create({
    nombre: datos.nombre,
    correo: datos.correo,
    password: hash,
    rol: 'ADMIN',
  });

  console.log('Administrador creado correctamente:');
  console.log(`  id:     ${id}`);
  console.log(`  correo: ${datos.correo}`);
  console.log('Ya puedes iniciar sesión en POST /api/auth/login');

  process.exit(0);
}

main().catch((error) => {
  console.error('Error al crear el administrador:', error.message);
  process.exit(1);
});
