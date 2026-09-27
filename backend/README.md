# AgroControl — Backend (API REST)

API del sistema AgroControl: **Node.js + Express + TypeScript + MySQL**.

## ¿Qué hay aquí?

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts                # Lee el .env en un solo lugar
│   ├── database/
│   │   ├── Conexion.ts           # Pool de conexiones a MySQL
│   │   └── DB_AGROCONTROL.sql    # Esquema de la base de datos
│   ├── middlewares/
│   │   ├── AuthMiddleware.ts     # verificarToken y verificarRol
│   │   └── ErrorMiddleware.ts    # Manejo centralizado de errores
│   ├── models/
│   │   ├── Usuario.ts            # Tipos de Usuario
│   │   ├── Auth.ts               # Tipos del token y del login
│   │   ├── Finca.ts              # Tipos de Finca
│   │   └── Animal.ts             # Tipos de Animal
│   ├── repositories/
│   │   ├── UsuarioRepository.ts  # Consultas de usuarios
│   │   ├── FincaRepository.ts    # Consultas de la finca
│   │   ├── AnimalRepository.ts   # Consultas de animales
│   │   └── HistorialRepository.ts# Historial (vista vw_historial_animal)
│   ├── routes/
│   │   ├── AuthRoutes.ts         # Endpoints de /api/auth
│   │   ├── FincaRoutes.ts        # Endpoints de /api/finca
│   │   └── AnimalRoutes.ts       # Endpoints de /api/animales
│   ├── scripts/
│   │   ├── crearAdmin.ts         # Crea el administrador inicial
│   │   └── crearFinca.ts         # Registra la finca principal
│   ├── services/
│   │   ├── AuthService.ts        # Login: bcrypt + JWT
│   │   ├── FincaService.ts       # Reglas de la finca
│   │   ├── AnimalService.ts      # Reglas de los animales
│   │   └── IndiceEstadoService.ts# Cálculo del Índice de Estado
│   ├── utils/
│   │   ├── AppError.ts           # Error de negocio con status HTTP
│   │   └── validacion.ts         # Helper para validar con Zod
│   ├── validators/
│   │   ├── AuthValidators.ts     # Esquemas Zod de autenticación
│   │   ├── FincaValidators.ts    # Esquemas Zod de la finca
│   │   └── AnimalValidators.ts   # Esquemas Zod de animales
│   ├── app.ts                    # Configuración de Express y rutas
│   └── server.ts                 # Arranque del servidor
├── public/                       # Páginas HTML de prueba (temporales)
├── .env                          # Tus datos locales (NO se sube a Git)
├── .env.example                  # Plantilla sin secretos
├── package.json
└── tsconfig.json
```

> **Arquitectura por capas:** `routes → services → repositories → base de datos`.
> Cada capa tiene una responsabilidad clara, lo que hace el código más
> fácil de leer, probar y mantener.


## ¿Cómo lo ejecuto?

1. **Instalar las dependencias** (una sola vez):

   ```bash
   cd backend
   pnpm install
   ```

2. **Arrancar en modo desarrollo** (se reinicia solo al guardar cambios):

   ```bash
   pnpm dev
   ```

3. **Comprobar que funciona**, abriendo en el navegador o en la terminal:

   ```
   http://localhost:3000/api/health
   ```

   Debe responder:
   ```json
   { "mensaje": "AgroControl API funcionando", "hora": "..." }
   ```

## Módulo de alertas y dashboard

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/dashboard` | Autenticado | Resumen completo del panel |
| GET | `/api/alertas` | Autenticado | Alertas (`?estado=&severidad=&tipo=`) |
| POST | `/api/alertas/sincronizar` | ADMIN, ENCARGADO | Fuerza el recálculo |
| PATCH | `/api/alertas/:id` | ADMIN, ENCARGADO | Resuelve o ignora |

Las alertas se **calculan al momento** (no hay tareas programadas) y se
sincronizan solas al abrir el dashboard. Si un problema desaparece, su alerta se
resuelve automáticamente; si empeora, sube de severidad.

Tipos de alerta: `VACUNA_PROXIMA`, `CONTROL_PENDIENTE`, `TRATAMIENTO_PENDIENTE`,
`INVENTARIO_BAJO`, `ACTIVIDAD_PENDIENTE`, `COSECHA_PROXIMA`, `ANIMAL_OBSERVACION`.

Severidades: `INFORMATIVA` (azul), `ADVERTENCIA` (amarillo), `CRITICA` (rojo).

## Administración de usuarios (CRUD, solo ADMIN)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/usuarios` | Lista todos |
| GET | `/api/usuarios/:id` | Un usuario |
| POST | `/api/usuarios` | Crea (contraseña cifrada con bcrypt) |
| PUT | `/api/usuarios/:id` | Actualiza nombre/teléfono |
| PATCH | `/api/usuarios/:id/rol` | Cambia el rol |
| PATCH | `/api/usuarios/:id/estado` | Activa / inactiva / suspende |
| PUT | `/api/usuarios/:id/password` | Cambia la contraseña (solo la propia) |
| DELETE | `/api/usuarios/:id` | **Borrado lógico** (desactiva) |

Reglas de seguridad:
- Nadie puede cambiar su propio rol, desactivarse ni eliminarse.
- Un admin **no** puede cambiar la contraseña de otro usuario.
- Los usuarios no se borran físicamente: se desactivan, porque tienen
  historial (actividades registradas, etc.).

## Módulo de cultivos y actividades agrícolas

### Ciclo de vida del cultivo

Las etapas siempre avanzan en este orden:

```
PREPARACION → SIEMBRA → CRECIMIENTO → MANTENIMIENTO → COSECHA → FINALIZADA
```

Reglas:
- Al llegar a `FINALIZADA` se guarda la **fecha real de cosecha** y el cultivo pasa a `FINALIZADO`.
- Si se retrocede a una etapa anterior, el cultivo vuelve a `ACTIVO`.
- Un cultivo `CANCELADO` no puede cambiar de etapa (`409`).

### Endpoints

| Método | Ruta | Acceso | Descrição |
|--------|------|--------|-------------|
| GET | `/api/cultivos` | Autenticado | Lista (`?etapa=&estado=&texto=`) |
| GET | `/api/cultivos/resumen` | Autenticado | Cantidad por etapa (pestañas) |
| GET | `/api/cultivos/:id` | Autenticado | Ficha del cultivo |
| GET | `/api/cultivos/:id/actividades` | Autenticado | Actividades del cultivo |
| POST | `/api/cultivos` | ADMIN, ENCARGADO | Crea un cultivo |
| PUT | `/api/cultivos/:id` | ADMIN, ENCARGADO | Actualiza datos |
| PATCH | `/api/cultivos/:id/etapa` | ADMIN, ENCARGADO | Avanza/retrocede etapa |
| PATCH | `/api/cultivos/:id/estado` | ADMIN, ENCARGADO | Cancelar o reactivar |
| POST | `/api/cultivos/:id/actividades` | ADMIN, ENCARGADO | Registra actividad |

### Datos de ejemplo

```bash
pnpm run datos-demo
```

Crea 6 cultivos y 6 actividades **solo si la tabla está vacía**, para poder ver
las pantallas con información.

## Módulo de salud (vacunas, tratamientos, controles, pesajes e incidentes)

Cada evento registrado **recalcula automáticamente el Índice de Estado** del animal.

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/animales/:id/vacunas` | ADMIN, ENCARGADO | Registra una vacuna |
| POST | `/api/animales/:id/tratamientos` | ADMIN, ENCARGADO | Registra un tratamiento |
| POST | `/api/animales/:id/controles` | ADMIN, ENCARGADO, TRABAJADOR | Registra un control |
| POST | `/api/animales/:id/pesajes` | ADMIN, ENCARGADO, TRABAJADOR | Registra un pesaje |
| POST | `/api/animales/:id/incidentes` | ADMIN, ENCARGADO | Registra un incidente |
| GET | `/api/animales/:id/proximos?dias=30` | Autenticado | Eventos programados a vencer |

> El TRABAJADOR puede medir y revisar (pesajes y controles), pero **no**
> registrar vacunas, tratamientos ni incidentes: son decisiones del
> encargado o del administrador.

### Ejemplo: registrar una vacuna

```bash
curl -X POST http://localhost:3000/api/animales/4/vacunas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "nombre": "Brucelosis",
    "fecha": "2026-09-20",
    "proxima_fecha": "2027-09-20",
    "dosis": "2ml"
  }'
```

Respuesta:

```json
{ "id_evento": 5, "estado_indice": "ATENCION" }
```

Fíjate que la respuesta ya trae el **nuevo Índice de Estado**: no hace falta
volver a consultarlo.

### Reglas de negocio

- El animal debe existir (`404`) y estar `ACTIVO` (`409` si está vendido o fallecido).
- La fecha de fin de un tratamiento no puede ser anterior a su fecha de inicio.
- La `proxima_fecha` no puede ser anterior a la fecha del evento.
- El peso debe estar entre 0 y 2000 kg.
- Un incidente necesita descripción y una gravedad válida.

## Sistema de permisos (matriz por rol)

La **fuente única de verdad** está en `src/config/permisos.ts`. El backend la
usa para bloquear lo que no está permitido, y el frontend la consulta con
`GET /api/auth/permisos` para mostrar solo lo que le corresponde a cada usuario.

| Módulo | ADMIN | ENCARGADO | TRABAJADOR |
|--------|-------|-----------|------------|
| Dashboard | ✅ ver | ✅ ver | ✅ ver |
| Finca | ✅ ver, crear, editar | ✅ ver, editar | ✅ ver |
| Animales | ✅ ver, crear, editar, cambiar estado | ✅ ver, crear, editar, cambiar estado | ✅ ver, historial |
| Salud – vacuna/tratamiento/incidente | ✅ | ✅ | ❌ |
| Salud – control/pesaje | ✅ | ✅ | ✅ |
| Alimentación | ✅ | ✅ | ✅ |
| Cultivos | ✅ ver, crear, editar | ✅ ver, crear, editar | ✅ ver |
| Producción | ✅ ver, registrar | ✅ ver, registrar | ✅ registrar |
| Inventario | ✅ ver, crear, editar, movimientos | ✅ ver, crear, editar, movimientos | ❌ |
| Actividades | ✅ ver, crear, editar, avance | ✅ ver, crear, editar, avance | ✅ ver, avance |
| Alertas | ✅ ver, resolver, sincronizar | ✅ ver, resolver, sincronizar | ✅ ver |
| Reportes | ✅ ver, exportar | ✅ ver, exportar | ❌ |
| **Usuarios (CRUD)** | ✅ **completo** | ❌ | ❌ |

### Cómo se aplica en el código

```ts
// config/permisos.ts — aquí se decide quién puede qué
usuarios: {
  ver: ['ADMIN'],
  crear: ['ADMIN'],
  editar: ['ADMIN'],
  // ...
},

// routes/UsuarioRoutes.ts — aquí se exige el permiso
router.post('/', verificarPermiso('usuarios', 'crear'), async (req, res) => { ... });
```

### Endpoint para el frontend

```
GET /api/auth/permisos
```

```json
{
  "rol": "TRABAJADOR",
  "permisos": {
    "animales": { "ver": true, "crear": false, "editar": false, "cambiar_estado": false, "ver_historial": true },
    "salud": { "registrar_vacuna": false, "registrar_pesaje": true, ... },
    "usuarios": { "ver": false, "crear": false, ... }
  }
}
```

Con esto el frontend puede **ocultar menús y botones** que el usuario no puede
usar. Ojo: ocultar botones es experiencia de usuario; la seguridad real la
aplica el backend, que responde `403` aunque alguien intente llamar la API a mano.

## Base de datos

La base se llama `agrocontrol_db` y ya está creada en el MySQL local
(18 tablas + 2 vistas). El script que la genera está en
`src/database/DB_AGROCONTROL.sql` por si necesitas recrearla.

## Autenticación (módulo de usuarios)

### Crear el administrador inicial

```bash
pnpm run crear-admin "Administrador" "admin@agrocontrol.test" "AgroControl1!"
```

El script cifra la contraseña con bcrypt y la guarda en la base de datos.

### Iniciar sesión

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@agrocontrol.test","password":"AgroControl1!"}'
```

Respuesta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "rol": "ADMIN",
  "usuario": { "id_usuario": 1, "nombre": "Administrador", "correo": "admin@agrocontrol.test" }
}
```

### Consultar el perfil con el token

```bash
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <token>"
```

### Endpoints

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/api/auth/login` | Inicia sesión (máx. 10 intentos cada 15 min) | Público |
| GET | `/api/auth/me` | Datos del usuario del token | Con token |

### Cómo se protegen las rutas

```ts
// Solo usuarios ADMIN pueden entrar
router.post('/', verificarToken, verificarRol('ADMIN'), async (req, res) => {
  // ...
});
```

- `verificarToken` revisa que el token JWT sea válido y no esté expirado.
- `verificarRol` revisa que el usuario tenga el permiso necesario.
- Ojo: ocultar botones en el frontend **no** es seguridad; la autoridad
  real siempre se aplica aquí, en el backend.

### Medidas de seguridad del módulo

- Contraseñas cifradas con **bcrypt (costo 12)**, nunca en texto plano.
- El hash **nunca** se devuelve en las respuestas de la API.
- Mensaje genérico "Credenciales inválidas" para no revelar qué correos existen.
- Límite de 10 intentos de login por IP cada 15 minutos (fuerza bruta).
- Validación de entradas con **Zod** en el backend.
- Consultas SQL **parametrizadas** (prevención de inyección SQL).

## Módulo de finca y animales

### Preparación (una sola vez)

```bash
pnpm run crear-finca "Finca La Esperanza" "Zona Norte" 5.5
```

### Endpoints de la finca

| Método | Ruta | Acceso |
|--------|------|--------|
| GET | `/api/finca` | Cualquier usuario autenticado |
| POST | `/api/finca` | ADMIN (solo si no existe) |
| PUT | `/api/finca` | ADMIN, ENCARGADO |

### Endpoints de animales

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/animales` | Autenticado | Lista con filtros |
| GET | `/api/animales/:id` | Autenticado | Ficha del animal |
| GET | `/api/animales/:id/historial` | Autenticado | Historial cronológico |
| POST | `/api/animales` | ADMIN, ENCARGADO | Registra un animal |
| PUT | `/api/animales/:id` | ADMIN, ENCARGADO | Actualiza la ficha |
| PATCH | `/api/animales/:id/estado` | ADMIN, ENCARGADO | VENDIDO / FALECIDO / etc. |
| POST | `/api/animales/recalcular-indices` | ADMIN, ENCARGADO | Recalcula el Índice de Estado |

**Filtros del listado** (query string, se pueden combinar):

```
GET /api/animales?estado_indice=ATENCION
GET /api/animales?estado_animal=ACTIVO
GET /api/animales?especie=Bovino
GET /api/animales?texto=Jersey
```

### Ejemplo: registrar un animal

```bash
curl -X POST http://localhost:3000/api/animales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "codigo": "V-024",
    "nombre": "Vaca 24",
    "especie": "Bovino",
    "raza": "Jersey",
    "sexo": "HEMBRA",
    "fecha_nacimiento": "2022-03-15",
    "fecha_ingreso": "2024-01-10",
    "ubicacion_finca": "Potrero 1"
  }'
```

### Índice de Estado del Animal

Se calcula en `IndiceEstadoService` aplicando estas reglas (solo animales `ACTIVO`):

| Estado | Condición |
|--------|-----------|
| 🔴 `ATENCION` | Vacunas/controles **vencidos** o incidentes graves sin resolver |
| 🟡 `OBSERVACION` | Vencimientos en los próximos **15 días** o sin pesaje en **90 días** |
| 🟢 `OPTIMO` | Ninguna de las anteriores |

El cálculo se apoya en la vista `vw_indice_estado` y el resultado se guarda en
`Animal.estado_indice` para poder filtrar rápido. **Es una herramienta
administrativa, no un diagnóstico veterinario.**

### Páginas de prueba (temporales)

Con el servidor arrancado (`pnpm run dev`) puedes abrir en el navegador:

- http://localhost:3000 → menú
- http://localhost:3000/prueba-login.html → probar el login
- http://localhost:3000/prueba-animales.html → registrar y listar animales

> Se eliminan cuando el frontend en Angular esté listo.


## Configuración (.env)

| Variable | Para qué sirve |
|----------|----------------|
| `PORT` | Puerto de la API (3000) |
| `JWT_SECRET` | Clave para firmar los tokens de sesión |
| `JWT_EXPIRES_IN` | Duración del token (1h) |
| `CORS_ORIGIN` | Frontend autorizado a llamar la API |
| `DB_HOST`, `DB_PORT` | Dirección y puerto de MySQL |
| `DB_USER`, `DB_PASSWORD` | Credenciales de MySQL |
| `DB_NAME` | Nombre de la base (`agrocontrol_db`) |

> El archivo `.env` está en `.gitignore`: nunca se sube al repositorio.
> Por eso también existe `.env.example`, que sí se sube y sirve de plantilla.
