// ============================================================
// repositories/HistorialRepository.ts
// Consulta el historial del animal usando la vista de la base de
// datos `vw_historial_animal`, que ya une vacunas, tratamientos,
// controles, pesajes, incidentes, alimentación y producción.
// ============================================================

import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';

interface HistorialRow extends RowDataPacket {
  fecha_evento: string;
  tipo_evento: string;
  id_evento: number;
  titulo: string;
  detalle: string | null;
  responsable: string | null;
}

export class HistorialRepository {
  /** Historial completo de un animal, del evento más reciente al más antiguo. */
  async porAnimal(idAnimal: number): Promise<HistorialRow[]> {
    const [filas] = await pool.query<HistorialRow[]>(
      `SELECT h.fecha_evento, h.tipo_evento, h.id_evento, h.titulo, h.detalle,
              u.nombre AS responsable
       FROM vw_historial_animal h
       LEFT JOIN Usuario u ON u.id_usuario = h.responsable
       WHERE h.id_animal = ?
       ORDER BY h.fecha_evento DESC`,
      [idAnimal]
    );

    return filas;
  }
}

export const historialRepository = new HistorialRepository();
