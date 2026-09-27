// ============================================================
// config/permisos.ts
// MATRIZ DE PERMISOS: la lista de qué puede hacer cada rol.
//
// Esta es la ÚNICA fuente de verdad de los permisos:
//   - El backend la usa para bloquear lo que no está permitido
//     (seguridad real).
//   - El frontend la consulta con GET /api/auth/permisos para
//     mostrar SOLO los módulos y botones que le corresponden a cada
//     usuario (experiencia de uso).
//
// Ventaja: si mañana se agrega un rol, se edita solo este archivo.
// ============================================================

import { Rol } from '../models/Usuario';

const TODOS: Rol[] = ['ADMIN', 'ENCARGADO', 'TRABAJADOR'];
const ADMIN_Y_ENCARGADO: Rol[] = ['ADMIN', 'ENCARGADO'];
const SOLO_ADMIN: Rol[] = ['ADMIN'];

/** Módulos del sistema y las acciones permitidas en cada uno. */
export const PERMISOS = {
  // --- Panel y vista general ---
  dashboard: {
    ver: TODOS,
  },

  // --- Finca ---
  finca: {
    ver: TODOS,
    crear: SOLO_ADMIN,
    editar: ADMIN_Y_ENCARGADO,
  },

  // --- Animales ---
  animales: {
    ver: TODOS,
    crear: ADMIN_Y_ENCARGADO,
    editar: ADMIN_Y_ENCARGADO,
    cambiar_estado: ADMIN_Y_ENCARGADO,
    ver_historial: TODOS,
  },

  // --- Salud del animal ---
  salud: {
    registrar_vacuna: ADMIN_Y_ENCARGADO,
    registrar_tratamiento: ADMIN_Y_ENCARGADO,
    registrar_control: TODOS, // El trabajador puede hacer controles básicos
    registrar_pesaje: TODOS, // Medir el peso es parte de su trabajo
    registrar_incidente: ADMIN_Y_ENCARGADO,
    ver_proximos: TODOS,
  },

  // --- Alimentación ---
  alimentacion: {
    ver: TODOS,
    registrar: TODOS,
  },

  // --- Cultivos y actividades agrícolas ---
  cultivos: {
    ver: TODOS,
    crear: ADMIN_Y_ENCARGADO,
    editar: ADMIN_Y_ENCARGADO,
  },

  // --- Producción ---
  // El trabajador registra leche a diario, así que también puede ver
  // el módulo. Si solo pudiera escribir y no ver, la pantalla que
  // aparece en su menú le respondería 403.
  produccion: {
    ver: TODOS,
    registrar: TODOS,
  },

  // --- Inventario ---
  inventario: {
    ver: ADMIN_Y_ENCARGADO,
    crear: ADMIN_Y_ENCARGADO,
    editar: ADMIN_Y_ENCARGADO,
    registrar_movimiento: ADMIN_Y_ENCARGADO,
  },

  // --- Actividades del personal ---
  actividades: {
    ver: TODOS,
    crear: ADMIN_Y_ENCARGADO,
    editar: ADMIN_Y_ENCARGADO,
    registrar_avance: TODOS, // Marcar una tarea como hecha
  },

  // --- Alertas ---
  alertas: {
    ver: TODOS,
    resolver: ADMIN_Y_ENCARGADO,
    regenerar: ADMIN_Y_ENCARGADO,
  },

  // --- Reportes ---
  reportes: {
    ver: ADMIN_Y_ENCARGADO,
    exportar: ADMIN_Y_ENCARGADO,
  },

  // --- Administración de usuarios (CRUD completo) ---
  usuarios: {
    ver: SOLO_ADMIN,
    crear: SOLO_ADMIN,
    editar: SOLO_ADMIN,
    cambiar_estado: SOLO_ADMIN,
    cambiar_rol: SOLO_ADMIN,
    cambiar_password: SOLO_ADMIN,
  },
} as const;

export type Modulo = keyof typeof PERMISOS;

/**
 * Indica si un rol tiene permiso para una acción de un módulo.
 * Si el módulo o la acción no existen, devuelve false (por omisión).
 */
export function tienePermiso(modulo: string, accion: string, rol: Rol): boolean {
  const moduloActual = (PERMISOS as Record<string, Record<string, Rol[] | undefined>>)[modulo];

  if (!moduloActual) return false;

  const roles = moduloActual[accion];

  return Array.isArray(roles) && roles.includes(rol);
}

/**
 * Devuelve únicamente los permisos del rol indicado, en forma
 * { modulo: { accion: true } }. Es lo que recibe el frontend
 * para decidir qué menús y botones pintar.
 */
export function permisosDeRol(rol: Rol): Record<string, Record<string, boolean>> {
  const resultado: Record<string, Record<string, boolean>> = {};

  for (const [modulo, acciones] of Object.entries(PERMISOS)) {
    resultado[modulo] = {};

    for (const accion of Object.keys(acciones)) {
      resultado[modulo][accion] = tienePermiso(modulo, accion, rol);
    }
  }

  return resultado;
}
