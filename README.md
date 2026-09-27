# 🌱 AgroControl

**Sistema web para la administración y seguimiento de fincas agrícolas y ganaderas.**

Centraliza la información de animales, cultivos, producción, inventario y
actividades de la finca en una sola plataforma, con especial énfasis en el
**historial individual de cada animal** y el **Índice de Estado del Animal**.

> ⚠️ El Índice de Estado es una herramienta **administrativa** de seguimiento.
> **No es un diagnóstico veterinario.**

---

## 🧰 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 22 · TypeScript · CSS |
| Backend | Node.js · Express 5 · TypeScript |
| Base de datos | MySQL 8 · InnoDB · utf8mb4 |
| Herramientas | pnpm · Angular CLI · Postman · MySQL Workbench |

---

## 📁 Estructura del proyecto

```
Default Project/
├── PROPUESTA-AGROCONTROL-MEJORADA.md   Propuesta del proyecto
├── DB_AGROCONTROL.sql                  Script de la base de datos
├── backend/                            API REST
│   ├── src/
│   │   ├── config/       env.ts · permisos.ts (matriz por rol)
│   │   ├── database/     Conexion.ts (pool) · DB_AGROCONTROL.sql
│   │   ├── middlewares/  Auth · Permiso · Error
│   │   ├── models/       Tipos de las entidades
│   │   ├── repositories/ Consultas SQL parametrizadas
│   │   ├── services/     Reglas de negocio
│   │   ├── validators/   Esquemas Zod
│   │   ├── routes/       Endpoints
│   │   ├── scripts/      Datos de ejemplo
│   │   ├── app.ts · server.ts
│   └── README.md
└── frontend/                           Aplicación Angular
    └── src/app/
        ├── core/         Servicios, interceptores, guardas
        ├── layout/       Menú lateral + barra superior
        ├── pages/        12 pantallas
        ├── shared/       Componentes reutilizables
        └── environments/
```

---

## ⚙️ Requisitos previos

- **Node.js 20 o superior** (probado en Node 24)
- **MySQL 8.0 o superior**
- **pnpm** (`npm install -g pnpm`)

---

## 🚀 Cómo levantar el proyecto

### 1️⃣ Base de datos

Crea la base `agrocontrol_db` ejecutando el script en MySQL Workbench:

```sql
SOURCE DB_AGROCONTROL.sql;
```

### 2️⃣ Backend (puerto 3000)

```bash
cd backend
pnpm install

# Copia la configuración y ajusta tus credenciales
copy .env.example .env        # Windows
# cp .env.example .env         # Linux/Mac

pnpm run crear-admin "Administrador" "admin@agrocontrol.test" "AgroControl1!"
pnpm run crear-finca "Finca La Esperanza" "Zona Norte" 5.5

# Opcional: datos de ejemplo para ver las pantallas llenas
pnpm run datos-demo
pnpm run datos-demo-2

pnpm run dev
```

### 3️⃣ Frontend (puerto 4200)

```bash
cd frontend
pnpm install
pnpm start
```

### 4️⃣ Entrar

Abre **http://localhost:4200**

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin@agrocontrol.test` | `AgroControl1!` | Administrador |
| `encargado@agrocontrol.test` | `Finca2026!` | Encargado de finca |
| `trabajador@agrocontrol.test` | `Finca2026!` | Trabajador |

> Las dos últimas cuentas las da de alta el administrador desde la pantalla
> **Usuarios**. Sirven para ver cómo cambia el sistema según el rol.

---

## 👥 Roles y permisos

La matriz de permisos vive en `backend/src/config/permisos.ts` y es la **única
fuente de verdad**: el backend la aplica (`403` si no tiene permiso) y el
frontend la consulta (`GET /api/auth/permisos`) para mostrar solo lo permitido.

| Módulo | ADMIN | ENCARGADO | TRABAJADOR |
|--------|-------|-----------|------------|
| Dashboard | ✅ | ✅ | ✅ |
| Animales: ver | ✅ | ✅ | ✅ |
| Animales: crear/editar | ✅ | ✅ | ❌ |
| Salud: vacuna/tratamiento/incidente | ✅ | ✅ | ❌ |
| Salud: control/pesaje | ✅ | ✅ | ✅ |
| Alimentación | ✅ | ✅ | ✅ |
| Cultivos: ver | ✅ | ✅ | ✅ |
| Cultivos: crear/editar | ✅ | ✅ | ❌ |
| Producción: ver/registrar | ✅ | ✅ | ✅ |
| Inventario | ✅ | ✅ | ❌ |
| Actividades: ver | ✅ | ✅ | ✅ |
| Actividades: crear/editar | ✅ | ✅ | ❌ |
| Actividades: marcar avance | ✅ | ✅ | ✅ |
| Alertas: ver / resolver | ✅ / ✅ | ✅ / ✅ | ✅ / ❌ |
| Reportes | ✅ | ✅ | ❌ |
| Usuarios (CRUD) | ✅ | ❌ | ❌ |
| Cambiar su contraseña | ✅ | ✅ | ✅ |

> Se probó **endpoint por endpoint** con las tres cuentas: todo módulo que le
> aparece a un rol en el menú le responde correctamente a ese rol.

---

## 🧩 Módulos

| Módulo | Qué hace |
|--------|----------|
| **Usuarios** | CRUD completo (solo ADMIN), con borrado lógico |
| **Finca** | Datos generales de la finca |
| **Animales** | Ficha, pesajes, incidentes, historial cronológico |
| **Salud** | Vacunas, tratamientos, controles y resumen sanitario |
| **Alimentación** | Registro por animal o grupo; **descuenta el inventario** |
| **Cultivos** | Cultivos con ciclo de vida de 6 etapas + actividades agrícolas |
| **Producción** | Leche, peso y cosechas; gráfica y ranking |
| **Inventario** | Productos y movimientos de stock en transacción |
| **Actividades** | Tareas del personal con estados |
| **Alertas** | Se generan y se sincronizan solas (7 tipos) |
| **Índice de Estado** | 🟢 Óptimo · 🟡 Observación · 🔴 Atención |
| **Reportes** | 5 reportes en JSON y CSV + vista imprimible (PDF) |
| **Dashboard** | Resumen con dona, barras, alertas y pendientes |

---

## 🔐 Seguridad implementada

- Contraseñas con **bcrypt (costo 12)**, nunca en texto plano.
- **JWT** de 1 hora; el hash nunca se devuelve en la API.
- **Rate limiting**: 10 intentos de login por IP cada 15 minutos.
- **Validación Zod** en el 100 % de los endpoints.
- **Consultas parametrizadas** (prevención de inyección SQL).
- **Lista blanca de columnas** en los UPDATE dinámicos.
- **Mensajes genéricos** para no revelar qué correos existen.
- **Roles y permisos** verificados en el backend.
- **Transacciones** para stock, movements y cambios relacionados.
- **Bitácora de auditoría** (`LogAuditoria` en la base de datos).
- `.env` fuera de Git + `.env.example` como plantilla.

---

## 🎓 Temas del curso que se ven en el código

Todo el frontend está escrito con la sintaxis **clásica** de Angular, que es la
que se explica en el curso. No se usan los bloques `@if` / `@for` / `@switch`
nuevos.

| Tema del curso | Dónde se ve |
|----------------|-------------|
| Componentes y `templateUrl` | `frontend/src/app/pages/*` (12 pantallas) |
| **Directivas `*ngIf` y `*ngFor`** | Todas las plantillas de `pages/` y `layout/shell.html` |
| `ngSwitch` / `*ngSwitchCase` | `pages/animales/detalle.html` (las 4 pestañas de la ficha) |
| **Pipes personalizados** | `shared/pipes/tiempo-relativo.pipe.ts` (usado en la ficha del animal) |
| **Comunicación entre componentes (`@Input` / `@Output`)** | `shared/icono.ts` y `shared/cambio-password.ts` |
| Servicios e **inyección de dependencias** | `core/api.service.ts`, `core/auth.service.ts` |
| Reactive Forms | `pages/login/login.ts` |
| **RxJS: `map`, `switchMap`, `forkJoin`** | `core/api.service.ts` → `fichaAnimal()` |
| Interceptores HTTP | `core/auth.interceptor.ts` (token) · `core/error.interceptor.ts` (errores) |
| **Rutas con `RouterModule`** | `app-routing.module.ts` (`RouterModule.forRoot`) + `app.routes.ts` |
| `routerLink`, `routerLinkActive`, parámetros de ruta | `layout/shell.html` · `pages/animales/detalle.ts` |
| **DOM, eventos, `fetch`, `async/await`** | `frontend/public/demo-js.html` (página sin Angular) |

### Página de práctica de JavaScript

`frontend/public/demo-js.html` es una página **HTML + CSS + JavaScript puro**
(sin Angular) que se abre en **http://localhost:4200/demo-js.html**:

- inicia sesión contra la API real con `fetch` + `async/await`;
- usa `Promise.all` para pedir dos datos a la vez;
- crea la tabla de animales **con el DOM** (`createElement`, `appendChild`);
- maneja `submit` y `click` con `addEventListener`;
- captura los errores del servidor con `try / catch`.

### Calidad de código

```bash
cd frontend

pnpm run lint          # ESLint + angular-eslint (0 errores)
pnpm run lint:fix      # corrige lo que se puede corregir solo
pnpm run format        # Prettier: deja el código con el mismo estilo
pnpm run format:check  # Verifica el formato sin cambiar nada
```

Además hay un **hook de Husky** (`.husky/pre-commit`) que ejecuta `pnpm run lint`
antes de cada `git commit`, para que nunca se suban errores al repositorio.

---

## 📚 Documentación

| Documento | Contenido |
|-----------|-----------|
| `PROPUESTA-AGROCONTROL-MEJORADA.md` | Propuesta completa (37 secciones) |
| `backend/README.md` | Endpoints, reglas de negocio y comandos |
| `DB_AGROCONTROL.sql` | Esquema comentado de la base de datos |
