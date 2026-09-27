// ============================================================
// utils/AppError.ts
// Error de "regla de negocio" con un código HTTP asociado.
//
// Ejemplo: "El animal no existe" es un 404, "el correo ya está
// registrado" es un 409. Con esta clase el manejador central de
// errores sabe qué.status devolver, en vez de responder siempre 500.
// ============================================================

export class AppError extends Error {
  status: number; // Código HTTP (400, 401, 403, 404, 409...)

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;

    // Necesario para que `instanceof AppError` funcione bien
    // cuando TypeScript compila a ES5/ES2020
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
