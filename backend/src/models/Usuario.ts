// ============================================================
// models/Usuario.ts
// Define los "tipos" (interfaces) de la tabla Usuario.
//
// ¿Por qué tipar? TypeScript no deja escribir `rol: "ADMINES"` sin
// avisar, así se detectan errores antes de tocar la base de datos.
// ============================================================

/** Roles permitidos en el sistema. */
export type Rol = 'ADMIN' | 'ENCARGADO' | 'TRABAJADOR';

/** Estados posibles de una cuenta. */
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

/** Fila de la tabla Usuario tal como viene de MySQL (incluye el hash). */
export interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  password: string; // Hash bcrypt, NUNCA la contraseña en texto plano
  rol: Rol;
  estado: EstadoUsuario;
  telefono: string | null;
  ultimo_login: Date | null;
  fecha_creacion: Date;
}

/**
 * Usuario "de cara al cliente": lo único que se devuelve en la API.
 * Omitimos `password` para que el hash viajere por accidente.
 */
export type UsuarioPublico = Omit<Usuario, 'password'>;
