# AGROCONTROL
## Sistema web para la administración y seguimiento de fincas agrícolas y ganaderas

> **Versión mejorada de la propuesta.** Se mantiene el contenido original, aplicando correcciones de modelo de datos, seguridad, estructura de código y planificación. El esquema de base de datos completo se encuentra en `DB_AGROCONTROL.sql`.

### Cambios aplicados en esta versión
| # | Mejora | Sección |
|---|--------|---------|
| 1 | Reglas concretas de cálculo del Índice de Estado del Animal | 15 |
| 2 | Modelo de BD corregido: sin relaciones polimórficas, con entidades faltantes, auditoría e índices | 25 |
| 3 | Estructura de código por capas (backend) y por dominio (frontend) | 27 |
| 4 | Sección de seguridad completa: JWT, bcrypt, rate limiting, validación, RBAC | 28 |
| 5 | Requerimientos no funcionales medibles | 32 |
| 6 | Alcance organizado en fases ejecutables (MVP) | 34 |
| 7 | Cronograma de desarrollo | 35 |
| 8 | Reportes definidos (CSV y PDF) y API explícita | 26, 31 |

---

## 1. Introducción

La administración de una finca agrícola y ganadera requiere llevar un control constante de diferentes actividades, recursos y procesos. El manejo de animales, cultivos, alimentación, tratamientos, vacunas, producción, inventario y actividades del personal genera una cantidad considerable de información que, cuando se registra de forma manual o dispersa, puede ser difícil de consultar y mantener actualizada.

Actualmente, muchas actividades relacionadas con la administración de una finca pueden realizarse mediante cuadernos, hojas de cálculo, documentos físicos o diferentes aplicaciones que no se encuentran integradas entre sí. Esta situación puede provocar pérdida de información, duplicidad de registros, dificultad para consultar el historial de un animal o cultivo y poca capacidad para obtener una visión general del estado de la finca.

Por esta razón, se propone el desarrollo de **AgroControl**, una plataforma web orientada a la administración integral de una finca agrícola y ganadera. El sistema permitirá centralizar la información de los animales, cultivos, trabajadores, actividades, alimentación, tratamientos, producción e inventario en una única plataforma.

Uno de los principales elementos diferenciadores de AgroControl será el seguimiento individual de los animales mediante un historial que permita consultar información relevante sobre su estado, controles, vacunas, tratamientos, alimentación y producción.

## 2. Nombre del proyecto

**AgroControl**
Nombre descriptivo: Sistema web para la administración y seguimiento de fincas agrícolas y ganaderas.

## 3. Descripción del proyecto

AgroControl será una plataforma web que permitirá administrar y controlar diferentes procesos relacionados con una finca de producción agrícola y ganadera.

El sistema permitirá registrar los animales existentes en la finca, administrar sus datos individuales y consultar su historial. También permitirá registrar vacunas, tratamientos, alimentación, controles y producción asociada a cada animal.

En el área agrícola, el sistema permitirá registrar cultivos, controlar sus diferentes etapas y almacenar información sobre actividades realizadas durante el ciclo de producción.

Además, AgroControl contará con módulos para administrar el inventario de productos e insumos, registrar actividades realizadas en la finca, controlar la producción y generar información resumida mediante un panel de control.

El sistema contará con diferentes niveles de usuario para limitar las acciones que cada persona puede realizar dentro de la plataforma.

Como elemento adicional, AgroControl contará con un **Índice de Estado del Animal**, cuyo propósito será utilizar la información registrada para identificar animales que puedan requerir observación o atención dentro de la gestión de la finca. Este índice será una herramienta administrativa y de seguimiento y **no representará un diagnóstico veterinario**.

## 4. Problemática

La administración de una finca agrícola y ganadera implica controlar simultáneamente diferentes procesos y recursos.

Entre los principales problemas que pueden presentarse se encuentran:

- Información registrada en cuadernos, hojas de cálculo o documentos separados.
- Dificultad para consultar rápidamente la información de un animal.
- Falta de un historial organizado de vacunas y tratamientos.
- Dificultad para conocer el estado actual de cada animal.
- Falta de control sobre la alimentación proporcionada.
- Dificultad para llevar seguimiento de la producción.
- Poca organización de las actividades realizadas en la finca.
- Dificultad para controlar los insumos disponibles.
- Pérdida o duplicidad de información.
- Dificultad para consultar información histórica.
- Falta de indicadores generales sobre la situación de la finca.
- Dificultad para identificar actividades o controles pendientes.

Cuando la información se encuentra dispersa, obtener una visión general de la operación puede requerir revisar diferentes registros manualmente.

Por ejemplo, para conocer la situación de un animal identificado como *Vaca #024*, actualmente podría ser necesario consultar diferentes documentos para encontrar su fecha de nacimiento, vacunas, tratamientos, alimentación, peso y producción.

AgroControl busca solucionar esta situación mediante la centralización de la información en una sola plataforma.

## 5. Justificación

El desarrollo de AgroControl permitirá aplicar tecnologías de desarrollo web para resolver una problemática relacionada con la administración de actividades agrícolas y ganaderas.

La plataforma permitirá centralizar la información de la finca y facilitar el acceso a los registros necesarios para realizar las actividades administrativas y operativas.

Uno de los principales beneficios será la posibilidad de mantener un historial individual para cada animal. Esto permitirá consultar la información relacionada con su desarrollo y los diferentes controles realizados durante su permanencia en la finca.

De igual manera, el módulo agrícola permitirá mantener organizada la información relacionada con los cultivos y sus actividades.

La implementación de un sistema de este tipo puede contribuir a reducir la dependencia de registros físicos y facilitar la consulta de información. Además, el enfoque integra conceptos de control de animales, cultivos, inventario, actividades y reportes dentro de una misma plataforma.

## 6. Objetivo general

Desarrollar una plataforma web para la administración y seguimiento de una finca agrícola y ganadera, permitiendo centralizar la información de animales, cultivos, producción, inventario y actividades, con el propósito de mejorar la organización y consulta de la información de la finca.

## 7. Objetivos específicos

1. Diseñar un sistema de usuarios con diferentes roles y permisos de acceso.
2. Registrar y administrar la información de los animales pertenecientes a la finca.
3. Implementar un historial individual para cada animal.
4. Registrar vacunas, tratamientos y controles realizados a los animales.
5. Registrar información relacionada con la alimentación de los animales.
6. Registrar y consultar información relacionada con la producción.
7. Administrar información sobre los cultivos existentes en la finca.
8. Registrar las actividades realizadas durante el ciclo de producción agrícola.
9. Implementar un módulo para el control de inventario de insumos y productos.
10. Registrar actividades realizadas por los trabajadores de la finca.
11. Implementar un panel de control con información resumida de la finca.
12. Generar alertas relacionadas con actividades o controles pendientes.
13. Implementar un Índice de Estado del Animal basado en los registros almacenados.
14. Generar reportes que permitan consultar información histórica y administrativa.
15. Diseñar una base de datos relacional que permita almacenar y relacionar la información de los diferentes módulos.

## 8. Usuarios del sistema

AgroControl contará inicialmente con tres tipos de usuarios.

### 8.1 Administrador
Será el usuario con mayor nivel de permisos.

Podrá:
- Crear y administrar usuarios.
- Asignar roles.
- Administrar información general de la finca.
- Registrar y modificar animales.
- Administrar cultivos.
- Administrar inventario.
- Consultar reportes.
- Consultar el panel general.
- Supervisar las actividades registradas.
- Consultar la bitácora de auditoría.

### 8.2 Encargado de finca
Será responsable de administrar las operaciones diarias de la finca.

Podrá:
- Registrar animales.
- Actualizar información de animales.
- Registrar vacunas y tratamientos.
- Registrar alimentación.
- Registrar producción.
- Administrar cultivos.
- Registrar actividades.
- Administrar inventario.
- Consultar reportes.
- Consultar alertas.

### 8.3 Trabajador
Tendrá permisos limitados y estará orientado principalmente al registro de actividades.

Podrá:
- Consultar información autorizada.
- Registrar actividades asignadas.
- Registrar alimentación.
- Registrar controles básicos.
- Registrar producción cuando corresponda.
- Consultar tareas pendientes.

No tendrá permisos para administrar usuarios, modificar configuraciones importantes o eliminar información crítica.

> **Nota:** en el backend cada endpoint tendrá explícitamente definidos los roles permitidos mediante middleware (`verificarToken` + `verificarRol`). Los permisos del frontend (ocultar menús/botones) son solo cosméticos; la autoridad real es el backend.

## 9. Módulos principales

AgroControl estará dividido en los siguientes módulos:

1. Usuarios y seguridad.
2. Finca.
3. Animales.
4. Salud y controles.
5. Alimentación.
6. Cultivos.
7. Producción.
8. Inventario.
9. Actividades.
10. Dashboard y reportes.
11. Alertas.
12. Índice de Estado del Animal.

## 10. Módulo de usuarios y seguridad

Este módulo permitirá controlar el acceso al sistema.

Cada usuario contará con:
- Nombre.
- Correo electrónico.
- Contraseña (almacenada solo como hash bcrypt, nunca en texto plano).
- Rol (`ADMIN`, `ENCARGADO`, `TRABAJADOR`).
- Estado (`ACTIVO`, `INACTIVO`, `SUSPENDIDO`).
- Teléfono y fotografía (opcionales).
- Fecha de creación, fecha de modificación y último inicio de sesión.

Política de contraseñas:
- Mínimo 8 caracteres.
-Debe contener al menos una letra mayúscula, una minúscula y un número.
- Se almacena con **bcrypt (costo 12)**; el hash nunca se devuelve en ninguna respuesta de la API.
- Los mensajes de error de login son genéricos ("Credenciales inválidas") para no revelar si el correo existe.

## 11. Módulo de finca

Permitirá almacenar la información general de la finca.

La información podrá incluir:
- Nombre de la finca.
- Ubicación.
- Descripción.
- Extensión (hectáreas).
- Tipo de producción (`AGRICOLA`, `GANADERA`, `MIXTA`).
- Información de contacto.
- Estado de la finca.

La finca funcionará como elemento principal para relacionar animales, cultivos, inventario y actividades. Aunque la primera versión trabajará con una sola finca, el modelo contempla varias para permitir escalabilidad.

## 12. Módulo de animales

Este será uno de los módulos principales de AgroControl.

Cada animal contará con una ficha individual.

La información podrá incluir:
- Código o identificador (único dentro de la finca).
- Nombre.
- Fotografía.
- Especie.
- Raza.
- Sexo (`MACHO`, `HEMBRA`).
- Fecha de nacimiento.
- Fecha de ingreso a la finca.
- Ubicación dentro de la finca.
- Estado del animal (`ACTIVO`, `VENDIDO`, `FALECIDO`, `TRANSFERIDO`).
- Último peso registrado (calculado desde el módulo de pesajes).
- Estado del Índice (calculado).
- Observaciones.

> **Cambio respecto a la versión anterior:** el peso ya no es un campo único de la ficha, sino una serie de registros de pesaje con fecha (`Pesaje`), ya que los animales se pesan periódicamente y esa evolución es justamente lo que permite el historial.

Por ejemplo:
- Animal: Vaca #024
- Especie: Bovino
- Raza: Jersey
- Sexo: Hembra
- Edad: 4 años
- Peso actual: 420 kg
- Estado: Óptimo
- Última vacuna: 15/03/2026
- Último control: 20/04/2026
- Producción registrada: 18 litros
- Observaciones: Sin novedades

De esta forma, toda la información importante del animal estará disponible desde una única ficha.

## 13. Historial individual del animal

Una de las características principales de AgroControl será el historial individual.

Cada animal tendrá asociado un historial cronológico que permitirá consultar los eventos registrados durante su permanencia en la finca.

El historial podrá incluir:
- Vacunas.
- Tratamientos.
- Controles.
- Pesajes.
- Alimentación.
- Producción.
- Incidentes.
- Observaciones.
- Cambios de estado.

**Implementación:** el historial se resuelve mediante una vista de base de datos (`vw_historial_animal`) que une los eventos de las tablas de vacunas, tratamientos, controles, pesajes, incidentes, alimentación y producción, ordenados por fecha. Esto evita duplicar información en una tabla de historial y garantiza que el historial siempre refleje los datos reales. Los cambios de estado provienen de la bitácora de auditoría.

Esto permitirá conocer la evolución del animal sin necesidad de consultar diferentes registros.

## 14. Módulo de salud y controles

Permitirá registrar información relacionada con la salud y seguimiento de los animales.

Se podrán registrar:
- Vacunas: nombre, fecha, próxima fecha, dosis, producto utilizado (relacionado con inventario), responsable, observaciones.
- Tratamientos: nombre, fecha de inicio, fecha de fin, descripción, producto, dosis, responsable, observaciones.
- Controles: fecha, tipo de control, descripción, próxima fecha de control, responsable, observaciones.
- Incidentes: fecha, tipo, gravedad, descripción, si quedó resuelto, responsable.

El sistema generará alertas cuando exista un control próximo o pendiente.

## 15. Índice de Estado del Animal

AgroControl incorporará un indicador denominado **Índice de Estado del Animal**.

Este indicador utilizará información registrada en el sistema para mostrar de forma sencilla la situación administrativa y de seguimiento de cada animal. Solo se evalúan animales en estado `ACTIVO`.

### Estados
- 🟢 **Estado óptimo** — El animal cuenta con sus registros y controles actualizados.
- 🟡 **Requiere observación** — Existe algún registro pendiente, próximo a vencer o alguna situación que requiere seguimiento.
- 🔴 **Requiere atención** — Existen registros pendientes o situaciones que deberían ser revisadas por el responsable de la finca.

### Reglas de cálculo (deterministas)

Se evalúan en este orden; el primer estado que se cumpla gana:

| Estado | Condición |
|--------|-----------|
| 🔴 **Requiere atención** | Existe alguna vacuna o control con `próxima_fecha` **vencida** (anterior a hoy), **o** existe un incidente grave sin resolver. |
| 🟡 **Requiere observación** | Algún vencimiento dentro de los **próximos 15 días**, **o** sin pesaje registrado en los **últimos 90 días**, **o** el producto de inventario asociado (vacuna, tratamiento o alimento) tiene stock por debajo del stock mínimo. |
| 🟢 **Óptimo** | Ninguna de las condiciones anteriores se cumple. |

### Cálculo y almacenamiento
- El cálculo lo realiza el backend (servicio `IndiceEstadoService`), consultando la vista `vw_indice_estado` o replicando las reglas en TypeScript.
- El resultado se cachea en la tabla `Animal` (columnas `estado_indice` y `estado_indice_fecha`) y se recalcula al registrar vacunas, tratamientos, controles, pesajes, incidentes o movimientos de inventario, y de forma global al iniciar sesión.
- La vista `vw_indice_estado` permite auditar *por qué* un animal tiene cierto estado (muestra vencidos, próximos y días sin pesaje).

> Este índice tendrá únicamente una función de seguimiento y gestión y **no sustituirá la evaluación realizada por un profesional veterinario**.

## 16. Módulo de alimentación

Permitirá registrar la alimentación proporcionada a los animales.

Se podrán almacenar:
- Animal **o** grupo/lote de animales (al menos uno de los dos es obligatorio).
- Tipo de alimento.
- Producto de inventario relacionado (opcional, para descontar consumo).
- Cantidad.
- Unidad de medida.
- Fecha y hora.
- Responsable.
- Observaciones.

La información se relacionará con el inventario: cuando el registro indica un producto, el sistema genera un movimiento de salida de inventario en la misma transacción.

## 17. Módulo de cultivos

El sistema permitirá administrar los cultivos existentes en la finca.

Cada cultivo podrá incluir:
- Nombre.
- Tipo de cultivo.
- Área.
- Fecha de siembra.
- Fecha estimada de cosecha.
- Fecha real de cosecha.
- Etapa actual.
- Ubicación.
- Responsable.
- Observaciones.

El sistema manejará las siguientes etapas:

```
Preparación → Siembra → Crecimiento → Mantenimiento → Cosecha → Finalizada
```

## 18. Actividades agrícolas

Se podrán registrar actividades relacionadas con los cultivos.

Entre ellas:
- Preparación del terreno.
- Siembra.
- Riego.
- Fertilización.
- Control de plagas.
- Mantenimiento.
- Cosecha.

Cada actividad podrá contener:
- Cultivo.
- Fecha.
- Tipo de actividad.
- Responsable.
- Descripción.
- Estado (`PENDIENTE`, `EN_PROCESO`, `COMPLETADA`, `CANCELADA`).
- Observaciones.

## 19. Módulo de producción

Permitirá registrar y consultar la producción generada por la finca.

**En el área ganadera** (`ProduccionGanadera`, siempre vinculada a un animal):
- Tipo (`LECHE`, `PESO`, `HUEVO`, `CARNE`, `OTRO`).
- Cantidad y unidad.
- Fecha.
- Responsable.

**En el área agrícola** (`ProduccionAgricola`, siempre vinculada a un cultivo):
- Producto cosechado.
- Cantidad y unidad.
- Fecha de cosecha.
- Cultivo relacionado.
- Responsable.

> **Cambio respecto a la versión anterior:** la propuesta original definía una tabla `Produccion` con `id_animal / id_cultivo`, lo que constituye una relación polimórfica, mala práctica en bases de datos relacionales. Se separa en dos tablas concretas, cada una con su foránea bien definida.

La información podrá utilizarse posteriormente para generar reportes.

## 20. Módulo de inventario

Permitirá controlar los productos e insumos utilizados dentro de la finca.

El inventario podrá incluir:
- Alimentos.
- Medicamentos.
- Vacunas.
- Fertilizantes.
- Semillas.
- Herramientas.
- Otros insumos.

Cada producto tendrá información como:
- Nombre.
- Categoría.
- Cantidad disponible (`stock_actual`).
- Unidad de medida.
- Stock mínimo.
- Fecha de vencimiento, cuando corresponda.
- Estado (`DISPONIBLE`, `BAJO`, `AGOTADO`, `VENCIDO`).

**Movimientos de inventario:** todo cambio de stock se registra en la tabla `MovimientoInventario` (`ENTRADA`, `SALIDA`, `AJUSTE`) con fecha, motivo y responsable. El `stock_actual` se actualiza en la misma transacción que el movimiento, garantizando consistencia. Se aplica restricción `CHECK (stock_actual >= 0)`.

El sistema generará una alerta cuando la cantidad disponible sea inferior al stock mínimo establecido.

## 21. Módulo de actividades

Permitirá registrar las actividades realizadas por los trabajadores.

Cada actividad podrá contener:
- Nombre.
- Descripción.
- Responsable (usuario de la finca).
- Fecha y hora.
- Tipo de actividad.
- Estado.
- Observaciones.

Los estados podrán ser:
- Pendiente.
- En proceso.
- Completada.
- Cancelada.

Este módulo permitirá al encargado tener una visión más organizada de las tareas realizadas en la finca.

## 22. Dashboard

AgroControl contará con un panel principal que mostrará información resumida de la finca.

Entre los indicadores principales estarán:
- Cantidad total de animales.
- Animales en estado óptimo.
- Animales que requieren observación.
- Animales que requieren atención.
- Cantidad de cultivos.
- Actividades pendientes.
- Producción registrada (ganadera y agrícola, por período).
- Productos con inventario bajo.
- Próximos controles.
- Próximas actividades.

Gráficas: evolución de producción de leche, peso de animales y consumos de inventario mediante Chart.js.

El dashboard permitirá que el encargado pueda identificar rápidamente situaciones que requieren atención.

## 23. Sistema de alertas

El sistema generará alertas relacionadas con diferentes módulos.

Algunos ejemplos serán:
- Vacuna próxima.
- Control pendiente.
- Tratamiento pendiente.
- Inventario bajo.
- Actividad pendiente.
- Cosecha próxima.
- Alimentación pendiente.
- Animal que requiere observación.

**Funcionamiento:**
- Cada alerta tiene severidad (`INFORMATIVA`, `ADVERTENCIA`, `CRITICA`) y estado (`ACTIVA`, `RESUELTA`, `IGNORADA`).
- Se recalculan al iniciar sesión y al consultar el panel de alertas.
- Las alertas resueltas no vuelven a aparecer hasta que la condición cambie.
- Cada alerta referencia (por foránea opcional) al animal, producto, cultivo o actividad que la origina, permitiendo navegar directamente al registro.

Las alertas tendrán como objetivo facilitar la supervisión y reducir el riesgo de olvidar actividades importantes.

## 24. Flujo general del sistema

El funcionamiento general de AgroControl será:

```
Inicio de sesión
      ↓
Identificación del usuario y rol (JWT)
      ↓
Dashboard
      ↓
Selección del módulo
      ↓
Registro o consulta de información (validación en backend)
      ↓
Almacenamiento en la base de datos (transacciones)
      ↓
Actualización de historial, bitácora e Índice de Estado
      ↓
Generación de alertas y reportes
```

Ejemplo de registro de un animal:

```
Registrar animal → Crear ficha → Registrar información inicial → Guardar animal
→ Registrar controles → Registrar alimentación → Registrar producción
→ Actualizar historial → Actualizar Índice de Estado → Mostrar información en dashboard.
```

## 25. Propuesta de base de datos

La base de datos será relacional y estará diseñada utilizando **MySQL** (InnoDB, `utf8mb4`).

> El script completo, con claves foráneas, restricciones CHECK, índices y la vista del historial, se encuentra en el archivo **`DB_AGROCONTROL.sql`**.

### Entidades principales

| Entidad | Descripción | Relaciones clave |
|---------|-------------|------------------|
| `Usuario` | Cuentas y roles del sistema | — |
| `Finca` | Información general de la finca | — |
| `Animal` | Ficha individual + estado del Índice | → Finca, Usuario |
| `Pesaje` | Pesos periódicos con fecha | → Animal, Usuario |
| `Vacuna` | Aplicación de vacunas y próxima fecha | → Animal, Producto, Usuario |
| `Tratamiento` | Tratamientos con inicio/fin | → Animal, Producto, Usuario |
| `ControlAnimal` | Controles y revisiones | → Animal, Usuario |
| `Incidente` | Eventos/lesiones registrados | → Animal, Usuario |
| `Cultivo` | Cultivos y sus etapas | → Finca, Usuario |
| `ActividadAgricola` | Actividades del ciclo del cultivo | → Cultivo, Usuario |
| `Actividad` | Tareas del personal | → Finca, Usuario |
| `ProduccionGanadera` | Producción por animal | → Animal, Usuario |
| `ProduccionAgricola` | Cosechas por cultivo | → Cultivo, Usuario |
| `Producto` | Inventario de insumos | → Finca, Usuario |
| `MovimientoInventario` | Entradas/salidas/ajustes de stock | → Producto, Usuario |
| `Alimentacion` | Registros de alimentación | → Animal, Producto, Usuario |
| `Alerta` | Alertas generadas y su estado | → Finca, Animal, Producto, Cultivo, Actividad |
| `LogAuditoria` | Bitácora de cambios críticos | → Usuario |
| `vw_historial_animal` | **Vista**: unión cronológica de eventos del animal | — |
| `vw_indice_estado` | **Vista**: datos de cálculo del Índice | — |

### Decisiones de diseño
1. **Sin relaciones polimórficas:** producción separada en `ProduccionGanadera` / `ProduccionAgricola`.
2. **Historial como vista:** evita duplicar eventos en una tabla propia.
3. **Auditoría:** campos `fecha_creacion`, `fecha_modificacion` y `creado_por` en las tablas principales, más `LogAuditoria` para cambios críticos (quién, qué, cuándo, valores anteriores/nuevos).
4. **Borrado lógico:** usuarios, animales y productos se desactivan mediante `estado` en lugar de eliminarse físicamente.
5. **Integridad:** claves foráneas con comportamiento explícito (`CASCADE`/`SET NULL`), `CHECK` en stocks y cantidades, y `UNIQUE (id_finca, código)` para identificadores de animales.
6. **Índices** en foráneas y columnas de consulta frecuente (`proxima_fecha`, `estado`, `fecha`).

## 26. Arquitectura propuesta

AgroControl utilizará una arquitectura basada en **cliente-servidor con API REST**.

```
Angular + TypeScript + HTML5 + CSS3
        ↓  HTTP / JSON (Bearer token)
API REST — Node.js + Express.js + TypeScript
        ↓  SQL parametrizado (mysql2)
MySQL (InnoDB)
```

### Estructura por capas del backend

```
Petición → Ruta (routes) → Middlewares (auth, rol, validación)
        → Servicio (reglas de negocio, transacciones)
        → Repositorio (SQL parametrizado)
        → MySQL
Respuesta ← Manejo de errores centralizado (AppError → errorHandler)
```

- **Routes:** definen endpoints, roles permitidos y validación de entrada; no contienen lógica de negocio.
- **Middlewares:** `verificarToken`, `verificarRol`, validadores y manejo de errores.
- **Services:** reglas de negocio, transacciones (ej. movimiento de inventario + stock + alerta) y cálculo del Índice de Estado.
- **Repositories:** únicos responsables del acceso a datos, siempre con consultas parametrizadas.
- **Models:** interfaces/tipos de las entidades.

### API REST (resumen)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| POST | `/api/auth/login` | Inicio de sesión | público |
| GET | `/api/auth/me` | Perfil del token actual | autenticado |
| GET/POST | `/api/fincas` | Información de la finca | ADMIN, ENCARGADO |
| GET/POST | `/api/animales` | Lista (filtro por Índice) y registro | todos |
| GET/PUT | `/api/animales/:id` | Ficha del animal | todos |
| GET | `/api/animales/:id/historial` | Historial cronológico | todos |
| POST | `/api/animales/:id/vacunas` | Registrar vacuna | ADMIN, ENCARGADO |
| POST | `/api/animales/:id/tratamientos` | Registrar tratamiento | ADMIN, ENCARGADO |
| POST | `/api/animales/:id/controles` | Registrar control | ADMIN, ENCARGADO |
| POST | `/api/animales/:id/pesajes` | Registrar pesaje | ADMIN, ENCARGADO, TRABAJADOR |
| GET/POST | `/api/alimentaciones` | Alimentación | todos |
| GET/POST | `/api/cultivos` | Cultivos | ADMIN, ENCARGADO |
| POST | `/api/cultivos/:id/actividades` | Actividad agrícola | ADMIN, ENCARGADO |
| GET/POST | `/api/produccion/ganadera` | Producción animal | ADMIN, ENCARGADO, TRABAJADOR |
| GET/POST | `/api/produccion/agricola` | Producción de cultivos | ADMIN, ENCARGADO, TRABAJADOR |
| GET/POST | `/api/productos` | Inventario | ADMIN, ENCARGADO |
| POST | `/api/productos/:id/movimientos` | Movimiento de stock | ADMIN, ENCARGADO |
| GET/POST | `/api/actividades` | Tareas del personal | todos (según rol) |
| GET | `/api/alertas` | Alertas activas | todos |
| PUT | `/api/alertas/:id/resolver` | Resolver alerta | ADMIN, ENCARGADO |
| GET | `/api/dashboard` | Resumen del panel | todos |
| GET | `/api/reportes/:tipo?formato=csv\|pdf` | Reportes | ADMIN, ENCARGADO |
| GET/POST | `/api/usuarios` | Administración de usuarios | ADMIN |

## 27. Estructura del código

### Backend

```
backend/
├── src/
│   ├── app.ts                 # Express, CORS, rutas, errores
│   ├── server.ts              # Arranque y prueba de conexión
│   ├── config/                # Variables de entorno y constantes
│   ├── database/
│   │   ├── Conexion.ts        # Pool de conexiones mysql2
│   │   └── DB_AGROCONTROL.sql # Esquema completo
│   ├── middlewares/
│   │   ├── AuthMiddleware.ts  # verificarToken, verificarRol
│   │   ├── ValidationMiddleware.ts
│   │   └── ErrorMiddleware.ts # errorHandler, rutaNoEncontrada
│   ├── models/                # Interfaces de entidades
│   ├── repositories/          # SQL parametrizado
│   ├── services/              # Lógica de negocio y transacciones
│   ├── validators/            # Esquemas de validación de entrada
│   ├── routes/                # Endpoints + middlewares por ruta
│   └── utils/                 # AppError, helpers
├── .env                       # Secretos (NO se sube a Git)
├── .env.example               # Plantilla sin secretos
├── .gitignore                 # .env, node_modules, dist
├── package.json
└── tsconfig.json
```

### Frontend

```
frontend/
├── src/
│   ├── environments/          # apiUrl por entorno
│   └── app/
│       ├── core/              # auth.guard, role.guard, auth.interceptor,
│       │                      # error.interceptor, token-storage.service
│       ├── models/            # Interfaces tipadas de la API
│       ├── services/          # Servicios HttpClient (uno por módulo)
│       ├── shared/            # Componentes reutilizables (botón, campo,
│       │                      # modal, tabla, toast, spinner, navbar)
│       ├── pages/
│       │   ├── login/  landing/  dashboard/
│       │   ├── animales/  salud/  alimentacion/
│       │   ├── cultivos/  produccion/  inventario/  actividades/
│       │   ├── alertas/  reportes/
│       │   └── admin/    # usuarios, finca
│       ├── app.routes.ts      # Carga diferida + guards por rol
│       └── app.config.ts
├── angular.json
└── package.json
```

**Convenciones:**
- Rutas con `loadComponent` (lazy loading) y `canActivate: [authGuard, roleGuard([...])]`.
- Un servicio de Angular por módulo; los modelos se comparten desde `models/`.
- Manejo de errores centralizado en `errorInterceptor` (traduce `{ mensaje, status }` a un error tipado; en 401 limpia sesión y redirige a login).
- Componentes reutilizables propios (patrón tipo "shader" de KROW) **o** Angular Material: elegir **uno solo** para mantener consistencia visual.

### Herramientas
- Visual Studio Code, Git, GitHub, Postman, MySQL Workbench.
- `.gitignore` desde el inicio (`.env`, `node_modules/`, `dist/`, `.angular/`).
- `README.md` con instrucciones de instalación y ejecución.
- Prettier para formateo uniforme del código.

## 28. Seguridad

Medidas que aplicará AgroControl:

### Autenticación
- **JWT Bearer** con expiración de 1 hora (`JWT_EXPIRES_IN=1h`) y payload mínimo (`id_usuario`, `rol`).
- `JWT_SECRET` de al menos 32 caracteres aleatorios, definido solo en `.env`.
- El frontend guarda el token y lo envía mediante interceptor HTTP; ante un 401 se limpia la sesión y se redirige a login.

### Contraseñas
- **bcrypt con costo 12**; el hash jamás se selecciona ni se devuelve en respuestas (las consultas proyectan solo las columnas necesarias).
- Política de fortaleza validada en frontend **y** backend.

### Protección de endpoints
- `verificarToken` en todas las rutas salvo login.
- `verificarRol('ADMIN', 'ENCARGADO', ...)` explícito por endpoint según la matriz de la sección 26.
- **Rate limiting** en `/api/auth/login` (máximo 10 intentos por IP cada 15 minutos) con `express-rate-limit`.
- Mensajes genéricos de autenticación para evitar enumeración de usuarios.

### Validación y acceso a datos
- Validación de **todos** los campos de entrada en el backend (Zod o express-validator) antes de tocar la base de datos: tipos, longitudes, formatos de fecha y valores de ENUM.
- **Whitelist de columnas** en cualquier `UPDATE` dinámico: nunca se interpolan nombres de columna provenientes del cliente.
- Consultas **100 % parametrizadas** (`?` de mysql2); sin concatenación de valores.
- Transacciones en operaciones multi-tabla (alimentación + salida de inventario + movimiento + alerta).

### Transporte y cabeceras
- `helmet` para cabeceras HTTP seguras.
- CORS restringido al origen exacto del frontend (`CORS_ORIGIN`), sin `*` en producción.
- HTTPS obligatorio en producción.

### Integridad y trazabilidad
- Borrado lógico mediante `estado` para usuarios, animales y productos.
- `LogAuditoria`: registro de quién modificó qué registro, con valores previos y nuevos (cambios críticos: usuarios, estado de animales, stock, roles).
- Manejo de errores centralizado: los errores 500 devuelven un mensaje genérico sin exponer detalles internos; los detalles quedan en el log del servidor.

### Frontend
- Guards de ruta por rol (acceso) + ocultamiento de acciones no permitidas (experiencia).
- Sanitización de entradas de texto (Angular) para evitar persistencia de HTML/JavaScript.
- Si se suben fotografías: validar tipo MIME (`jpg/png/webp`), tamaño máximo 2 MB y guardar con nombre aleatorio en una carpeta estática controlada.

### Gestión de secretos
- `.env` ignorado por Git y `.env.example` como plantilla (nunca con valores reales).
- Los secretos no se comparten por chat, repositorios ni documentación pública.

## 29. Requerimientos funcionales

El sistema deberá:

| Código | Requerimiento |
|--------|---------------|
| RF01 | Permitir el inicio de sesión de usuarios. |
| RF02 | Permitir administrar usuarios. |
| RF03 | Permitir asignar roles y permisos. |
| RF04 | Permitir registrar fincas. |
| RF05 | Permitir registrar animales. |
| RF06 | Permitir modificar información de animales. |
| RF07 | Permitir consultar el historial de cada animal. |
| RF08 | Permitir registrar vacunas. |
| RF09 | Permitir registrar tratamientos. |
| RF10 | Permitir registrar controles. |
| RF11 | Permitir registrar alimentación. |
| RF12 | Permitir registrar cultivos. |
| RF13 | Permitir registrar actividades agrícolas. |
| RF14 | Permitir registrar producción (ganadera y agrícola). |
| RF15 | Permitir administrar inventario y sus movimientos. |
| RF16 | Permitir registrar actividades de trabajadores. |
| RF17 | Generar alertas. |
| RF18 | Calcular el Índice de Estado del Animal. |
| RF19 | Mostrar información resumida mediante un dashboard. |
| RF20 | Generar reportes exportables en **CSV y PDF**. |
| RF21 | Permitir registrar pesajes e incidentes de los animales. |
| RF22 | Registrar en bitácora las modificaciones críticas de información. |

## 30. Requerimientos no funcionales

| Categoría | Requerimiento medible |
|-----------|----------------------|
| **Seguridad** | Contraseñas con bcrypt (costo 12); JWT de 1 h; rate limiting de 10 intentos/15 min en login; validación de entrada en el 100 % de los endpoints; ningún endpoint accesible sin token salvo el login. |
| **Usabilidad** | Registrar un animal y su primera vacuna en menos de 2 minutos para un usuario capacitado; navegación máxima de 3 clics desde el panel hasta cualquier módulo; interfaz adaptable a pantallas de 1366×768 o mayores. |
| **Rendimiento** | Consultas de listado y registro respondidas en menos de 2 segundos con 10 000 registros; panel de control en menos de 3 segundos. |
| **Disponibilidad** | 99 % de disponibilidad durante el horario operativo de pruebas; reinicio del servicio sin pérdida de datos (transacciones). |
| **Mantenibilidad** | Arquitectura por capas (routes → services → repositories); TypeScript estricto sin errores de compilación; guía de estilos aplicada de forma uniforme; README con instrucciones completas. |
| **Integridad** | Todas las relaciones definidas con claves foráneas; restricciones `CHECK` en stock y cantidades; operaciones multi-tabla ejecutadas en transacción con rollback ante error. |
| **Compatibilidad** | Funcionamiento correcto en versiones actuales de Chrome y Edge; consumo de la API mediante JSON. |

## 31. Beneficios esperados

La implementación de AgroControl permitirá:
- Centralizar la información de la finca.
- Reducir la dependencia de registros físicos.
- Facilitar la consulta de información.
- Mantener un historial individual de los animales.
- Mejorar el seguimiento de vacunas y tratamientos.
- Facilitar el control de alimentación.
- Organizar la información de los cultivos.
- Mejorar el control del inventario.
- Facilitar el seguimiento de actividades.
- Consultar información de producción.
- Identificar situaciones que requieren atención.
- Facilitar la generación de reportes.
- Mejorar la disponibilidad de información para la toma de decisiones.
- Trazabilidad de quién registró o modificó cada información relevante.

## 32. Alcance del proyecto

La primera versión de AgroControl estará enfocada en una finca que combine actividades agrícolas y ganaderas.

El proyecto incluirá:
- Sistema de usuarios.
- Roles y permisos.
- Administración de la finca.
- Registro de animales.
- Historial individual de animales.
- Vacunas.
- Tratamientos.
- Controles.
- Alimentación.
- Cultivos.
- Actividades agrícolas.
- Producción.
- Inventario.
- Actividades de trabajadores.
- Dashboard.
- Alertas.
- Índice de Estado del Animal.
- Reportes básicos.

El sistema estará diseñado principalmente como una aplicación web.

## 33. Planificación por fases

Para asegurar la entrega, el alcance anterior se desarrolla en tres fases dentro de la misma primera versión:

### Fase 1 — MVP (mínimo viable)
- Estructura del proyecto, base de datos, autenticación y roles.
- CRUD de finca y usuarios.
- Animales: ficha, pesajes, incidentes.
- Salud: vacunas, tratamientos, controles + historial.
- Alimentación básica.
- Índice de Estado y alertas básicas.
- Dashboard mínimo.

> Con la Fase 1 el sistema ya resuelve la problemática central: centralizar la información del animal con historial e indicadores.

### Fase 2 — Módulos productivos
- Cultivos y actividades agrícolas.
- Producción ganadera y agrícola.
- Inventario con movimientos y alertas de stock.

### Fase 3 — Cierre
- Actividades del personal completas.
- Dashboard con gráficas.
- Reportes CSV y PDF.
- Bitácora de auditoría.
- Pulido de interfaz, pruebas y documentación.

## 34. Cronograma estimado

| Etapa | Contenido | Duración |
|-------|-----------|----------|
| 1 | Análisis, diseño de BD y diseño de interfaz | 2 semanas |
| 2 | Base de datos + autenticación + usuarios + finca | 2 semanas |
| 3 | Módulo de animales, salud, historial y alimentación | 3 semanas |
| 4 | Cultivos, actividades agrícolas, producción e inventario | 3 semanas |
| 5 | Dashboard, alertas, Índice de Estado y reportes | 2 semanas |
| 6 | Pruebas, correcciones, documentación y entrega | 1 semana |
| | **Total estimado** | **13 semanas** |

## 35. Funcionalidades futuras

Como posibles ampliaciones posteriores se contemplan:
- Aplicación móvil.
- Códigos QR para identificación de animales.
- Identificación mediante RFID.
- Geolocalización de animales y áreas de cultivo.
- Integración con dispositivos IoT.
- Integración con sensores.
- Información meteorológica.
- Mapas de la finca.
- Notificaciones móviles y por correo (recordatorios de vacunas).
- Análisis estadístico avanzado.
- Predicción de producción.
- Inteligencia artificial.
- Integración con equipos agrícolas.
- Automatización de procesos.
- Módulo financiero avanzado.
- Control de ventas y clientes.
- Refresh tokens para sesiones prolongadas.

Estas funcionalidades no forman parte del alcance inicial y podrán desarrollarse en futuras versiones.

## 36. Impacto esperado

AgroControl busca demostrar cómo una solución tecnológica puede contribuir a mejorar la organización de los procesos de una finca.

El principal impacto esperado será la centralización de información que normalmente puede encontrarse distribuida entre diferentes medios.

La plataforma permitirá que los responsables puedan consultar información histórica y actual desde un único sistema, facilitando el seguimiento de animales, cultivos, inventario y actividades.

Además, el uso de indicadores y alertas permitirá identificar situaciones que requieran atención de manera más rápida.

## 37. Conclusión

AgroControl representa una propuesta de sistema web orientada a mejorar la administración de una finca agrícola y ganadera mediante la centralización y organización de la información.

El proyecto integrará diferentes áreas de la finca dentro de una única plataforma, incluyendo animales, salud, alimentación, cultivos, producción, inventario y actividades.

Uno de los elementos principales será el historial individual de cada animal, permitiendo consultar de manera organizada los diferentes eventos asociados durante su permanencia en la finca. Complementariamente, el Índice de Estado del Animal permitirá visualizar de forma sencilla qué registros o situaciones requieren seguimiento mediante reglas de cálculo definidas y auditables.

La propuesta combina el desarrollo de una aplicación web, una API REST y una base de datos relacional, permitiendo aplicar conocimientos de frontend, backend, bases de datos, seguridad y diseño de sistemas.

En conclusión, AgroControl busca proporcionar una solución tecnológica organizada, escalable y funcional para la gestión de una finca agrícola y ganadera, estableciendo una base que pueda ampliarse posteriormente con tecnologías como aplicaciones móviles, códigos QR, sensores, geolocalización e inteligencia artificial.
