// ============================================================
// core/api.service.ts
// Un servicio por módulo que habla con la API.
// Cada método devuelve un Observable con el dato ya tipado.
// ============================================================

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Alerta,
  Animal,
  Cultivo,
  EstadoIndice,
  EventoHistorial,
  FichaAnimal,
  Movimiento,
  ProximoEvento,
  Producto,
  Reporte,
  ResumenDashboard,
  ResumenInventario,
  ResumenProduccion,
  Tarea,
  Usuario,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // --- Animales ---

  /** Lista los animales. Acepta filtros opcionales. */
  listarAnimales(filtros: Record<string, string> = {}) {
    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor) params = params.set(clave, valor);
    }

    return this.http.get<Animal[]>(`${this.base}/animales`, { params });
  }

  /**
   * Historial cronológico del animal.
   * Lo usa fichaAnimal() más abajo (todavía no hay pantalla suelta).
   */
  obtenerHistorial(id: number) {
    return this.http.get<EventoHistorial[]>(`${this.base}/animales/${id}/historial`);
  }

  /** Próximos eventos programados del animal (lo usa fichaAnimal). */
  obtenerProximos(id: number, dias = 30) {
    return this.http.get<ProximoEvento[]>(`${this.base}/animales/${id}/proximos?dias=${dias}`);
  }

  // ============================================================
  //  EJEMPLO DE RxJS: map y switchMap
  //
  //  Los Observables dejan encadenar las peticiones en vez de
  //  llamarlas una por una y coordinar las respuestas a mano.
  // ============================================================

  /**
   * Carga la ficha completa de un animal en una sola suscripción.
   *
   * - switchMap: cuando llega el animal, se usa SU id para pedir el
   *   historial y los próximos eventos. Como las peticiones dependen
   *   del resultado anterior, se encadenan. Si el usuario abre otra
   *   ficha antes de que termine esta, switchMap cancela la que iba
   *   en curso (por eso se llama switch: "cambia" de petición).
   * - forkJoin: espera a que terminen las dos peticiones y entrega
   *   un solo objeto con los tres resultados.
   * - map: transforma ese objeto (ordena el historial) sin volver
   *   a preguntar nada al servidor.
   * - catchError: si el animal no está ACTIVO, el backend responde
   *   409 al pedir los próximos eventos. Se atrapa ese error y se
   *   devuelve una lista vacía, para que la ficha se siga viendo.
   */
  fichaAnimal(id: number): Observable<FichaAnimal> {
    return this.http.get<Animal>(`${this.base}/animales/${id}`).pipe(
      switchMap((animal) =>
        forkJoin({
          animal: of(animal),
          historial: this.obtenerHistorial(animal.id_animal),
          proximos: this.obtenerProximos(animal.id_animal, 30).pipe(
            catchError(() => of([] as ProximoEvento[])),
          ),
        }),
      ),
      map((datos) => ({
        ...datos,
        // Del más reciente al más antiguo (copia para no ordenar el
        // arreglo original: [...datos.historial]).
        historial: [...datos.historial].sort((a, b) =>
          b.fecha_evento.localeCompare(a.fecha_evento),
        ),
      })),
    );
  }

  // --- Salud ---

  /** Registra una vacuna. */
  registrarVacuna(idAnimal: number, datos: Record<string, unknown>) {
    return this.http.post(`${this.base}/animales/${idAnimal}/vacunas`, datos);
  }

  /** Resumen sanitario de todos los animales activos. */
  resumenSalud(dias = 30) {
    return this.http.get<
      {
        id_animal: number;
        codigo: string;
        nombre: string | null;
        especie: string;
        estado_indice: EstadoIndice;
        proximas_vacunas: number;
        proximos_controles: number;
        ultimo_pesaje: string | null;
      }[]
    >(`${this.base}/salud/resumen?dias=${dias}`);
  }

  /** Registra un pesaje. */
  registrarPesaje(idAnimal: number, datos: Record<string, unknown>) {
    return this.http.post(`${this.base}/animales/${idAnimal}/pesajes`, datos);
  }

  // --- Panel y alertas ---

  /** Resumen completo del dashboard. */
  obtenerDashboard() {
    return this.http.get<ResumenDashboard>(`${this.base}/dashboard`);
  }

  /** Alertas activas. */
  listarAlertas(filtros: Record<string, string> = {}) {
    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor) params = params.set(clave, valor);
    }

    return this.http.get<Alerta[]>(`${this.base}/alertas`, { params });
  }

  /** Resuelve o ignora una alerta. */
  resolverAlerta(id: number, estado: 'RESUELTA' | 'IGNORADA') {
    return this.http.patch(`${this.base}/alertas/${id}`, { estado });
  }

  // --- Cultivos ---

  /** Lista los cultivos con filtros opcionales. */
  listarCultivos(filtros: Record<string, string> = {}) {
    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor) params = params.set(clave, valor);
    }

    return this.http.get<Cultivo[]>(`${this.base}/cultivos`, { params });
  }

  /** Crea un cultivo. */
  crearCultivo(datos: Record<string, unknown>) {
    return this.http.post<Cultivo>(`${this.base}/cultivos`, datos);
  }

  /** Cambia la etapa del cultivo. */
  cambiarEtapaCultivo(id: number, etapa: string) {
    return this.http.patch<Cultivo>(`${this.base}/cultivos/${id}/etapa`, { etapa });
  }

  /** Cambia el estado del cultivo (cancelar/reactivar). */
  cambiarEstadoCultivo(id: number, estado: string) {
    return this.http.patch<Cultivo>(`${this.base}/cultivos/${id}/estado`, { estado });
  }

  // --- Inventario ---

  listarProductos(filtros: Record<string, string> = {}) {
    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor) params = params.set(clave, valor);
    }

    return this.http.get<Producto[]>(`${this.base}/inventario`, { params });
  }

  resumenInventario() {
    return this.http.get<ResumenInventario>(`${this.base}/inventario/resumen`);
  }

  movimientosProducto(id: number) {
    return this.http.get<Movimiento[]>(`${this.base}/inventario/${id}/movimientos`);
  }

  crearProducto(datos: Record<string, unknown>) {
    return this.http.post<Producto>(`${this.base}/inventario`, datos);
  }

  /** Registra entrada, salida o ajuste de stock. */
  registrarMovimiento(id: number, datos: Record<string, unknown>) {
    return this.http.post<{ producto: Producto; stock_nuevo: number }>(
      `${this.base}/inventario/${id}/movimientos`,
      datos,
    );
  }

  // --- Producción ---

  resumenProduccion(dias = 30) {
    return this.http.get<ResumenProduccion>(`${this.base}/produccion/resumen?dias=${dias}`);
  }

  registrarProduccion(datos: Record<string, unknown>) {
    return this.http.post(`${this.base}/produccion/ganadera`, datos);
  }

  // --- Actividades (tareas) ---

  listarActividades(filtros: Record<string, string> = {}) {
    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor) params = params.set(clave, valor);
    }

    return this.http.get<Tarea[]>(`${this.base}/actividades`, { params });
  }

  crearTarea(datos: Record<string, unknown>) {
    return this.http.post<Tarea>(`${this.base}/actividades`, datos);
  }

  cambiarEstadoTarea(id: number, estado: string) {
    return this.http.patch<Tarea>(`${this.base}/actividades/${id}/estado`, { estado });
  }

  // --- Reportes ---

  listarReportes() {
    return this.http.get<{ reportes: { tipo: string; titulo: string; icono: string }[] }>(
      `${this.base}/reportes`,
    );
  }

  obtenerReporte(tipo: string) {
    return this.http.get<Reporte>(`${this.base}/reportes/${tipo}`);
  }

  // --- Alimentación ---

  /** Registra la alimentación de un animal o de un grupo. */
  registrarAlimentacion(datos: Record<string, unknown>) {
    return this.http.post<{ id_alimentacion: number; stock_restante: number | null }>(
      `${this.base}/alimentacion`,
      datos,
    );
  }

  // --- Usuarios (solo ADMIN) ---

  /** Cambia la contraseña del usuario que inició sesión. */
  cambiarPassword(passwordActual: string, passwordNuevo: string) {
    return this.http.put<{ mensaje: string }>(`${this.base}/auth/password`, {
      passwordActual,
      passwordNuevo,
    });
  }

  /** Actualiza los datos del perfil propio (nombre y teléfono). */
  actualizarPerfil(datos: { nombre?: string; telefono?: string }) {
    return this.http.put<Usuario>(`${this.base}/auth/me`, datos);
  }

  /** Lista todos los usuarios. */
  listarUsuarios() {
    return this.http.get<Usuario[]>(`${this.base}/usuarios`);
  }

  /** Crea un usuario (la contraseña se cifra en el backend). */
  crearUsuario(datos: Record<string, unknown>) {
    return this.http.post<Usuario>(`${this.base}/usuarios`, datos);
  }

  /** Actualiza nombre/teléfono. */
  actualizarUsuario(id: number, datos: Record<string, unknown>) {
    return this.http.put<Usuario>(`${this.base}/usuarios/${id}`, datos);
  }

  /** Cambia el rol. */
  cambiarRolUsuario(id: number, rol: string) {
    return this.http.patch<Usuario>(`${this.base}/usuarios/${id}/rol`, { rol });
  }

  /** Activa, desactiva o suspende. */
  cambiarEstadoUsuario(id: number, estado: string) {
    return this.http.patch<Usuario>(`${this.base}/usuarios/${id}/estado`, { estado });
  }

  /** Borrado lógico (desactiva la cuenta). */
  eliminarUsuario(id: number) {
    return this.http.delete<{ mensaje: string }>(`${this.base}/usuarios/${id}`);
  }
}
