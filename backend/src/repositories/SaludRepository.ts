// ============================================================
// repositories/SaludRepository.ts
// Consultas SQL de las tablas del módulo de salud:
// Vacuna, Tratamiento, ControlAnimal, Pesaje e Incidente.
//
// Se agrupan en un solo repositorio porque pertenecen al mismo
// módulo y así se mantiene el proyecto ordenado.
// ============================================================

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../database/Conexion';
import { ProximoEvento, TipoControl, TipoIncidente, Gravedad } from '../models/Salud';

interface ProximoRow extends RowDataPacket {
  tipo: 'VACUNA' | 'TRATAMIENTO' | 'CONTROL';
  titulo: string;
  fecha: string;
}

export class SaludRepository {
  /**
   * Resumen sanitario por animal: cuántos controles y vacunas están
   * programados en los próximos días y cuándo fue el último pesaje.
   * Es lo que alimenta la pantalla "Salud" del menú.
   */
  async resumenPorAnimal(idFinca: number, dias: number) {
    const [filas] = await pool.query<
      (RowDataPacket & {
        id_animal: number;
        codigo: string;
        nombre: string | null;
        especie: string;
        estado_indice: string;
        proximas_vacunas: number;
        proximos_controles: number;
        ultimo_pesaje: string | null;
      })[]
    >(
      `SELECT a.id_animal, a.codigo, a.nombre, a.especie, a.estado_indice,
              (SELECT COUNT(*) FROM Vacuna v
               WHERE v.id_animal = a.id_animal AND v.proxima_fecha IS NOT NULL
                 AND v.proxima_fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
              ) AS proximas_vacunas,
              (SELECT COUNT(*) FROM ControlAnimal c
               WHERE c.id_animal = a.id_animal AND c.proxima_fecha IS NOT NULL
                 AND c.proxima_fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
              ) AS proximos_controles,
              (SELECT MAX(p.fecha) FROM Pesaje p WHERE p.id_animal = a.id_animal) AS ultimo_pesaje
       FROM Animal a
       WHERE a.id_finca = ? AND a.estado_animal = 'ACTIVO'
       ORDER BY a.codigo`,
      [dias, dias, idFinca]
    );

    return filas.map((f) => ({
      id_animal: f.id_animal,
      codigo: f.codigo,
      nombre: f.nombre,
      especie: f.especie,
      estado_indice: f.estado_indice,
      proximas_vacunas: Number(f.proximas_vacunas),
      proximos_controles: Number(f.proximos_controles),
      ultimo_pesaje: f.ultimo_pesaje,
    }));
  }

  /** Inserta una vacuna. */
  async createVacuna(
    datos: {
      nombre: string;
      fecha: string;
      proxima_fecha?: string;
      dosis?: string;
      descripcion?: string;
      id_producto?: number;
    },
    idAnimal: number,
    idUsuario: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Vacuna (id_animal, id_producto, nombre, fecha, proxima_fecha, dosis, responsable, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idAnimal,
        datos.id_producto ?? null,
        datos.nombre,
        datos.fecha,
        datos.proxima_fecha ?? null,
        datos.dosis ?? null,
        idUsuario,
        datos.descripcion ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Inserta un tratamiento. */
  async createTratamiento(
    datos: {
      nombre: string;
      fecha_inicio: string;
      fecha_fin?: string;
      dosis?: string;
      descripcion?: string;
      id_producto?: number;
    },
    idAnimal: number,
    idUsuario: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Tratamiento (id_animal, id_producto, nombre, fecha_inicio, fecha_fin, dosis, descripcion, responsable)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idAnimal,
        datos.id_producto ?? null,
        datos.nombre,
        datos.fecha_inicio,
        datos.fecha_fin ?? null,
        datos.dosis ?? null,
        datos.descripcion ?? null,
        idUsuario,
      ]
    );

    return resultado.insertId;
  }

  /** Inserta un control o revisión. */
  async createControl(
    datos: { fecha: string; tipo: TipoControl; descripcion?: string; proxima_fecha?: string },
    idAnimal: number,
    idUsuario: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO ControlAnimal (id_animal, fecha, tipo, descripcion, proxima_fecha, responsable)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idAnimal,
        datos.fecha,
        datos.tipo,
        datos.descripcion ?? null,
        datos.proxima_fecha ?? null,
        idUsuario,
      ]
    );

    return resultado.insertId;
  }

  /** Inserta un pesaje. */
  async createPesaje(
    datos: { peso: number; fecha?: string; descripcion?: string },
    idAnimal: number,
    idUsuario: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Pesaje (id_animal, peso, fecha, responsable, observaciones)
       VALUES (?, ?, COALESCE(?, NOW()), ?, ?)`,
      [
        idAnimal,
        datos.peso,
        datos.fecha ? `${datos.fecha} 00:00:00` : null,
        idUsuario,
        datos.descripcion ?? null,
      ]
    );

    return resultado.insertId;
  }

  /** Inserta un incidente. */
  async createIncidente(
    datos: {
      fecha?: string;
      tipo: TipoIncidente;
      gravedad: Gravedad;
      descripcion: string;
      descripcion_extra?: string;
      resuelto?: boolean;
    },
    idAnimal: number,
    idUsuario: number
  ): Promise<number> {
    const [resultado] = await pool.query<ResultSetHeader>(
      `INSERT INTO Incidente (id_animal, fecha, tipo, gravedad, descripcion, resuelto, responsable, observaciones)
       VALUES (?, COALESCE(?, NOW()), ?, ?, ?, ?, ?, ?)`,
      [
        idAnimal,
        datos.fecha ?? null,
        datos.tipo,
        datos.gravedad,
        datos.descripcion,
        datos.resuelto ?? false,
        idUsuario,
        datos.descripcion_extra ?? null,
      ]
    );

    return resultado.insertId;
  }

  /**
   * Próximos eventos de salud de un animal (vacunas, tratamientos
   * y controles programados) dentro de los próximos `dias` días.
   *
   * El texto lleva COLLATE porque al unir resultados de tablas
   * distintas MySQL exige el mismo ordenamiento de caracteres.
   */
  async proximosEventos(idAnimal: number, dias: number): Promise<ProximoEvento[]> {
    const [filas] = await pool.query<ProximoRow[]>(
      `SELECT 'VACUNA' COLLATE utf8mb4_unicode_ci AS tipo,
              nombre COLLATE utf8mb4_unicode_ci AS titulo,
              proxima_fecha AS fecha
       FROM Vacuna
       WHERE id_animal = ? AND proxima_fecha IS NOT NULL
         AND proxima_fecha >= CURDATE()
         AND proxima_fecha <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       UNION ALL
       SELECT 'TRATAMIENTO' COLLATE utf8mb4_unicode_ci,
              nombre COLLATE utf8mb4_unicode_ci,
              fecha_fin
       FROM Tratamiento
       WHERE id_animal = ? AND fecha_fin IS NOT NULL
         AND fecha_fin >= CURDATE()
         AND fecha_fin <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       UNION ALL
       SELECT 'CONTROL' COLLATE utf8mb4_unicode_ci,
              tipo COLLATE utf8mb4_unicode_ci,
              proxima_fecha
       FROM ControlAnimal
       WHERE id_animal = ? AND proxima_fecha IS NOT NULL
         AND proxima_fecha >= CURDATE()
         AND proxima_fecha <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY fecha ASC`,
      [idAnimal, dias, idAnimal, dias, idAnimal, dias]
    );

    // Calculamos cuántos días faltan para cada evento
    return filas.map((fila) => {
      const diasRestantes = Math.ceil(
        (new Date(fila.fecha).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
      );

      return {
        tipo: fila.tipo,
        titulo: fila.titulo,
        fecha: fila.fecha,
        dias_restantes: diasRestantes,
      };
    });
  }
}

export const saludRepository = new SaludRepository();
