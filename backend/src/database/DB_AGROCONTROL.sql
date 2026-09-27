-- ============================================================
-- AGROCONTROL — Esquema de base de datos (versión mejorada)
-- Sistema web para la administración y seguimiento de fincas
-- agrícolas y ganaderas.
--
-- Motor: MySQL 8+ (InnoDB, utf8mb4)
-- Script idempotente: puede ejecutarse completo sin errores.
-- ============================================================

DROP DATABASE IF EXISTS agrocontrol_db;
CREATE DATABASE agrocontrol_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE agrocontrol_db;

-- ============================================================
-- USUARIO — cuentas, roles y permisos del sistema
-- ============================================================
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- hash bcrypt, nunca texto plano
    rol ENUM('ADMIN', 'ENCARGADO', 'TRABAJADOR') NOT NULL DEFAULT 'TRABAJADOR',
    estado ENUM('ACTIVO', 'INACTIVO', 'SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO',
    telefono VARCHAR(20),
    fotografia VARCHAR(255),
    ultimo_login DATETIME NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT NULL,
    CONSTRAINT fk_usuario_creador
        FOREIGN KEY (creado_por) REFERENCES Usuario (id_usuario)
        ON DELETE SET NULL
) ENGINE = InnoDB;

-- ============================================================
-- FINCA — información general; elemento raíz de los módulos
-- ============================================================
CREATE TABLE Finca (
    id_finca INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    ubicacion VARCHAR(200),
    extension DECIMAL(10, 2) NULL COMMENT 'Extensión en hectáreas',
    descripcion TEXT,
    tipo_produccion ENUM('AGRICOLA', 'GANADERA', 'MIXTA') NOT NULL DEFAULT 'MIXTA',
    contacto_telefono VARCHAR(20),
    contacto_correo VARCHAR(150),
    estado ENUM('ACTIVA', 'INACTIVA') NOT NULL DEFAULT 'ACTIVA',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ============================================================
-- PRODUCTO — inventario de insumos (definido antes que las
-- tablas que lo referencian: vacunas, tratamientos, alimentación)
-- ============================================================
CREATE TABLE Producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_finca INT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    categoria ENUM(
        'ALIMENTO', 'MEDICAMENTO', 'VACUNA',
        'FERTILIZANTE', 'SEMILLA', 'HERRAMIENTA', 'OTRO'
    ) NOT NULL,
    unidad VARCHAR(30) NOT NULL,
    stock_actual DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fecha_vencimiento DATE NULL,
    estado ENUM('DISPONIBLE', 'BAJO', 'AGOTADO', 'VENCIDO') NOT NULL DEFAULT 'DISPONIBLE',
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT NULL,
    CONSTRAINT fk_producto_finca FOREIGN KEY (id_finca) REFERENCES Finca (id_finca),
    CONSTRAINT fk_producto_usuario FOREIGN KEY (creado_por) REFERENCES Usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_stock_actual CHECK (stock_actual >= 0),
    CONSTRAINT chk_stock_minimo CHECK (stock_minimo >= 0)
) ENGINE = InnoDB;

CREATE INDEX idx_producto_categoria ON Producto (id_finca, categoria);
CREATE INDEX idx_producto_estado ON Producto (estado);

-- ============================================================
-- ANIMAL — ficha individual + estado del Índice (cacheado)
-- ============================================================
CREATE TABLE Animal (
    id_animal INT AUTO_INCREMENT PRIMARY KEY,
    id_finca INT NOT NULL,
    codigo VARCHAR(30) NOT NULL COMMENT 'Identificador único dentro de la finca',
    nombre VARCHAR(80),
    especie VARCHAR(60) NOT NULL,
    raza VARCHAR(60),
    sexo ENUM('MACHO', 'HEMBRA') NOT NULL,
    fecha_nacimiento DATE NULL,
    fecha_ingreso DATE NOT NULL,
    ubicacion_finca VARCHAR(100),
    estado_animal ENUM('ACTIVO', 'VENDIDO', 'FALECIDO', 'TRANSFERIDO') NOT NULL DEFAULT 'ACTIVO',
    observaciones VARCHAR(1000),
    -- Índice de Estado del Animal: valor calculado y cacheado por el backend
    estado_indice ENUM('OPTIMO', 'OBSERVACION', 'ATENCION') NOT NULL DEFAULT 'OPTIMO',
    estado_indice_fecha DATETIME NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT NULL,
    CONSTRAINT fk_animal_finca FOREIGN KEY (id_finca) REFERENCES Finca (id_finca),
    CONSTRAINT fk_animal_usuario FOREIGN KEY (creado_por) REFERENCES Usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT uk_animal_codigo UNIQUE KEY (id_finca, codigo)
) ENGINE = InnoDB;

CREATE INDEX idx_animal_estado ON Animal (id_finca, estado_animal);
CREATE INDEX idx_animal_indice ON Animal (estado_indice);

-- ============================================================
-- PESAJE — pesajes periódicos (el peso histórico, no un campo único)
-- ============================================================
CREATE TABLE Pesaje (
    id_pesaje INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    peso DECIMAL(6, 2) NOT NULL COMMENT 'Peso en kilogramos',
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responsable INT NULL,
    observaciones VARCHAR(500),
    CONSTRAINT fk_pesaje_animal FOREIGN KEY (id_animal) REFERENCES Animal (id_animal) ON DELETE CASCADE,
    CONSTRAINT fk_pesaje_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_peso CHECK (peso > 0)
) ENGINE = InnoDB;

CREATE INDEX idx_pesaje_animal_fecha ON Pesaje (id_animal, fecha);

-- ============================================================
-- VACUNA — aplicación de vacunas y próxima fecha (alertas)
-- ============================================================
CREATE TABLE Vacuna (
    id_vacuna INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    id_producto INT NULL COMMENT 'Producto de inventario utilizado (si aplica)',
    nombre VARCHAR(120) NOT NULL,
    fecha DATE NOT NULL,
    proxima_fecha DATE NULL,
    dosis VARCHAR(60),
    responsable INT NULL,
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vacuna_animal FOREIGN KEY (id_animal) REFERENCES Animal (id_animal) ON DELETE CASCADE,
    CONSTRAINT fk_vacuna_producto FOREIGN KEY (id_producto) REFERENCES Producto (id_producto) ON DELETE SET NULL,
    CONSTRAINT fk_vacuna_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_vacuna_proxima ON Vacuna (proxima_fecha);

-- ============================================================
-- TRATAMIENTO — tratamientos con inicio y fin
-- ============================================================
CREATE TABLE Tratamiento (
    id_tratamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    id_producto INT NULL,
    nombre VARCHAR(120) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    dosis VARCHAR(60),
    descripcion VARCHAR(1000),
    responsable INT NULL,
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tratamiento_animal FOREIGN KEY (id_animal) REFERENCES Animal (id_animal) ON DELETE CASCADE,
    CONSTRAINT fk_tratamiento_producto FOREIGN KEY (id_producto) REFERENCES Producto (id_producto) ON DELETE SET NULL,
    CONSTRAINT fk_tratamiento_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_tratamiento_fechas ON Tratamiento (id_animal, fecha_fin);

-- ============================================================
-- CONTROL ANIMAL — revisiones/controles con próxima fecha
-- ============================================================
CREATE TABLE ControlAnimal (
    id_control INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    fecha DATE NOT NULL,
    tipo ENUM('GENERAL', 'CLINICO', 'LABORATORIO', 'REPRODUCTIVO', 'OTRO') NOT NULL DEFAULT 'GENERAL',
    descripcion VARCHAR(1000),
    proxima_fecha DATE NULL COMMENT 'Próximo control programado (genera alerta)',
    responsable INT NULL,
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_control_animal FOREIGN KEY (id_animal) REFERENCES Animal (id_animal) ON DELETE CASCADE,
    CONSTRAINT fk_control_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_control_proxima ON ControlAnimal (proxima_fecha);

-- ============================================================
-- INCIDENTE — eventos/lesiones registrados
-- ============================================================
CREATE TABLE Incidente (
    id_incidente INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('LESION', 'ENFERMEDAD', 'ACCIDENTE', 'COMPORTAMIENTO', 'OTRO') NOT NULL,
    gravedad ENUM('LEVE', 'MODERADA', 'GRAVE') NOT NULL DEFAULT 'LEVE',
    descripcion VARCHAR(1000) NOT NULL,
    resuelto BOOLEAN NOT NULL DEFAULT FALSE,
    responsable INT NULL,
    observaciones VARCHAR(500),
    CONSTRAINT fk_incidente_animal FOREIGN KEY (id_animal) REFERENCES Animal (id_animal) ON DELETE CASCADE,
    CONSTRAINT fk_incidente_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_incidente_abierto ON Incidente (id_animal, resuelto, gravedad);

-- ============================================================
-- CULTIVO — cultivos y sus etapas
-- ============================================================
CREATE TABLE Cultivo (
    id_cultivo INT AUTO_INCREMENT PRIMARY KEY,
    id_finca INT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(80),
    area DECIMAL(10, 2) NULL COMMENT 'Área en hectáreas',
    fecha_siembra DATE NOT NULL,
    fecha_cosecha_estimada DATE NULL,
    fecha_cosecha_real DATE NULL,
    etapa ENUM(
        'PREPARACION', 'SIEMBRA', 'CRECIMIENTO',
        'MANTENIMIENTO', 'COSECHA', 'FINALIZADA'
    ) NOT NULL DEFAULT 'PREPARACION',
    ubicacion VARCHAR(150),
    responsable INT NULL,
    observaciones VARCHAR(1000),
    estado ENUM('ACTIVO', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_por INT NULL,
    CONSTRAINT fk_cultivo_finca FOREIGN KEY (id_finca) REFERENCES Finca (id_finca),
    CONSTRAINT fk_cultivo_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_cultivo_usuario FOREIGN KEY (creado_por) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_cultivo_etapa ON Cultivo (id_finca, etapa);

-- ============================================================
-- ACTIVIDAD AGRICOLA — actividades del ciclo del cultivo
-- ============================================================
CREATE TABLE ActividadAgricola (
    id_actividad_agricola INT AUTO_INCREMENT PRIMARY KEY,
    id_cultivo INT NOT NULL,
    fecha DATE NOT NULL,
    tipo ENUM(
        'PREPARACION', 'SIEMBRA', 'RIEGO', 'FERTILIZACION',
        'CONTROL_PLAGAS', 'MANTENIMIENTO', 'COSECHA', 'OTRA'
    ) NOT NULL,
    descripcion VARCHAR(1000),
    estado ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    responsable INT NULL,
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_actagricola_cultivo FOREIGN KEY (id_cultivo) REFERENCES Cultivo (id_cultivo) ON DELETE CASCADE,
    CONSTRAINT fk_actagricola_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_actagricola_fecha ON ActividadAgricola (fecha, estado);

-- ============================================================
-- ACTIVIDAD — tareas del personal de la finca
-- ============================================================
CREATE TABLE Actividad (
    id_actividad INT AUTO_INCREMENT PRIMARY KEY,
    id_finca INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(1000),
    tipo ENUM(
        'AGRICOLA', 'GANADERA', 'ADMINISTRATIVA',
        'MANTENIMIENTO', 'OTRA'
    ) NOT NULL DEFAULT 'OTRA',
    fecha DATE NOT NULL,
    hora TIME NULL,
    estado ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    responsable INT NULL,
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_actividad_finca FOREIGN KEY (id_finca) REFERENCES Finca (id_finca),
    CONSTRAINT fk_actividad_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_actividad_fecha ON Actividad (fecha, estado);

-- ============================================================
-- PRODUCCION GANADERA — siempre vinculada a un animal
-- (separada de la agrícola para evitar relación polimórfica)
-- ============================================================
CREATE TABLE ProduccionGanadera (
    id_produccion_ganadera INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    tipo ENUM('LECHE', 'PESO', 'HUEVO', 'CARNE', 'OTRO') NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    unidad VARCHAR(30) NOT NULL,
    fecha DATE NOT NULL,
    responsable INT NULL,
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_proggan_animal FOREIGN KEY (id_animal) REFERENCES Animal (id_animal) ON DELETE CASCADE,
    CONSTRAINT fk_proggan_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_proggan_cantidad CHECK (cantidad >= 0)
) ENGINE = InnoDB;

CREATE INDEX idx_proggan_fecha ON ProduccionGanadera (id_animal, fecha);

-- ============================================================
-- PRODUCCION AGRICOLA — siempre vinculada a un cultivo
-- ============================================================
CREATE TABLE ProduccionAgricola (
    id_produccion_agricola INT AUTO_INCREMENT PRIMARY KEY,
    id_cultivo INT NOT NULL,
    producto VARCHAR(120) NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    unidad VARCHAR(30) NOT NULL,
    fecha_cosecha DATE NOT NULL,
    responsable INT NULL,
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_proagri_cultivo FOREIGN KEY (id_cultivo) REFERENCES Cultivo (id_cultivo) ON DELETE CASCADE,
    CONSTRAINT fk_proagri_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_proagri_cantidad CHECK (cantidad >= 0)
) ENGINE = InnoDB;

CREATE INDEX idx_proagri_fecha ON ProduccionAgricola (fecha_cosecha);

-- ============================================================
-- ALIMENTACION — registro por animal o por grupo/lote
-- ============================================================
CREATE TABLE Alimentacion (
    id_alimentacion INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NULL COMMENT 'Animal individual (opcional si se indica grupo)',
    grupo VARCHAR(100) NULL COMMENT 'Grupo/lote de animales (opcional si se indica animal)',
    id_producto INT NULL COMMENT 'Producto de inventario relacionado (descuenta stock)',
    tipo_alimento VARCHAR(120) NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    unidad VARCHAR(30) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NULL,
    responsable INT NULL,
    observaciones VARCHAR(500),
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alimentacion_animal FOREIGN KEY (id_animal) REFERENCES Animal (id_animal) ON DELETE CASCADE,
    CONSTRAINT fk_alimentacion_producto FOREIGN KEY (id_producto) REFERENCES Producto (id_producto) ON DELETE SET NULL,
    CONSTRAINT fk_alimentacion_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_alimentacion_destino CHECK (id_animal IS NOT NULL OR grupo IS NOT NULL),
    CONSTRAINT chk_alimentacion_cantidad CHECK (cantidad > 0)
) ENGINE = InnoDB;

CREATE INDEX idx_alimentacion_fecha ON Alimentacion (fecha);

-- ============================================================
-- MOVIMIENTO INVENTARIO — fuente de verdad del stock
-- ============================================================
CREATE TABLE MovimientoInventario (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    tipo ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(200),
    responsable INT NULL,
    observaciones VARCHAR(500),
    CONSTRAINT fk_movimiento_producto FOREIGN KEY (id_producto) REFERENCES Producto (id_producto) ON DELETE CASCADE,
    CONSTRAINT fk_movimiento_responsable FOREIGN KEY (responsable) REFERENCES Usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_movimiento_cantidad CHECK (cantidad > 0)
) ENGINE = InnoDB;

CREATE INDEX idx_movimiento_producto_fecha ON MovimientoInventario (id_producto, fecha);

-- ============================================================
-- ALERTA — alertas generadas por el sistema
-- ============================================================
CREATE TABLE Alerta (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    id_finca INT NOT NULL,
    tipo ENUM(
        'VACUNA_PROXIMA', 'CONTROL_PENDIENTE', 'TRATAMIENTO_PENDIENTE',
        'INVENTARIO_BAJO', 'ACTIVIDAD_PENDIENTE', 'COSECHA_PROXIMA',
        'ALIMENTACION_PENDIENTE', 'ANIMAL_OBSERVACION'
    ) NOT NULL,
    severidad ENUM('INFORMATIVA', 'ADVERTENCIA', 'CRITICA') NOT NULL DEFAULT 'INFORMATIVA',
    mensaje VARCHAR(300) NOT NULL,
    -- Referencias opcionales al registro que origina la alerta
    id_animal INT NULL,
    id_producto INT NULL,
    id_cultivo INT NULL,
    id_actividad INT NULL,
    fecha_deteccion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('ACTIVA', 'RESUELTA', 'IGNORADA') NOT NULL DEFAULT 'ACTIVA',
    fecha_resolucion DATETIME NULL,
    resuelta_por INT NULL,
    CONSTRAINT fk_alerta_finca FOREIGN KEY (id_finca) REFERENCES Finca (id_finca) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_animal FOREIGN KEY (id_animal) REFERENCES Animal (id_animal) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_producto FOREIGN KEY (id_producto) REFERENCES Producto (id_producto) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_cultivo FOREIGN KEY (id_cultivo) REFERENCES Cultivo (id_cultivo) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_actividad FOREIGN KEY (id_actividad) REFERENCES Actividad (id_actividad) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_resuelta FOREIGN KEY (resuelta_por) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_alerta_estado ON Alerta (estado, severidad);

-- ============================================================
-- LOG AUDITORIA — bitácora de cambios críticos
-- ============================================================
CREATE TABLE LogAuditoria (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NULL COMMENT 'Usuario que realizó la acción',
    tabla VARCHAR(50) NOT NULL,
    id_registro INT NOT NULL,
    accion ENUM('CREAR', 'ACTUALIZAR', 'ELIMINAR') NOT NULL,
    datos_previos JSON NULL,
    datos_nuevos JSON NULL,
    ip VARCHAR(45) NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario) ON DELETE SET NULL
) ENGINE = InnoDB;

CREATE INDEX idx_log_tabla_registro ON LogAuditoria (tabla, id_registro);
CREATE INDEX idx_log_fecha ON LogAuditoria (fecha);

-- ============================================================
-- VISTA: HISTORIAL INDIVIDUAL DEL ANIMAL
-- Une cronológicamente todos los eventos del animal sin
-- duplicar información en una tabla de historial.
--
-- IMPORTANTE: todas las columnas de texto llevan
-- "COLLATE utf8mb4_unicode_ci". Sin esto, al consultar la vista
-- MySQL responde "Illegal mix of collations for operation
-- 'UNION'", porque los textos literales y los de las columnas
-- usan ordenamientos distintos.
-- ============================================================
CREATE OR REPLACE VIEW vw_historial_animal AS
SELECT
    v.id_animal,
    v.fecha AS fecha_evento,
    'VACUNA' COLLATE utf8mb4_unicode_ci AS tipo_evento,
    v.id_vacuna AS id_evento,
    v.nombre COLLATE utf8mb4_unicode_ci AS titulo,
    CONCAT('Proxima: ', DATE_FORMAT(v.proxima_fecha, '%d/%m/%Y')) COLLATE utf8mb4_unicode_ci AS detalle,
    v.responsable
FROM Vacuna v
UNION ALL
SELECT
    t.id_animal,
    t.fecha_inicio,
    'TRATAMIENTO' COLLATE utf8mb4_unicode_ci,
    t.id_tratamiento,
    t.nombre COLLATE utf8mb4_unicode_ci,
    t.descripcion COLLATE utf8mb4_unicode_ci,
    t.responsable
FROM Tratamiento t
UNION ALL
SELECT
    c.id_animal,
    c.fecha,
    'CONTROL' COLLATE utf8mb4_unicode_ci,
    c.id_control,
    c.tipo COLLATE utf8mb4_unicode_ci,
    c.descripcion COLLATE utf8mb4_unicode_ci,
    c.responsable
FROM ControlAnimal c
UNION ALL
SELECT
    p.id_animal,
    p.fecha,
    'PESAJE' COLLATE utf8mb4_unicode_ci,
    p.id_pesaje,
    CONCAT(p.peso, ' kg') COLLATE utf8mb4_unicode_ci,
    p.observaciones COLLATE utf8mb4_unicode_ci,
    p.responsable
FROM Pesaje p
UNION ALL
SELECT
    i.id_animal,
    i.fecha,
    'INCIDENTE' COLLATE utf8mb4_unicode_ci,
    i.id_incidente,
    i.tipo COLLATE utf8mb4_unicode_ci,
    i.descripcion COLLATE utf8mb4_unicode_ci,
    i.responsable
FROM Incidente i
UNION ALL
SELECT
    a.id_animal,
    a.fecha,
    'ALIMENTACION' COLLATE utf8mb4_unicode_ci,
    a.id_alimentacion,
    a.tipo_alimento COLLATE utf8mb4_unicode_ci,
    CONCAT(a.cantidad, ' ', a.unidad) COLLATE utf8mb4_unicode_ci,
    a.responsable
FROM Alimentacion a
WHERE a.id_animal IS NOT NULL
UNION ALL
SELECT
    pg.id_animal,
    pg.fecha,
    'PRODUCCION' COLLATE utf8mb4_unicode_ci,
    pg.id_produccion_ganadera,
    pg.tipo COLLATE utf8mb4_unicode_ci,
    CONCAT(pg.cantidad, ' ', pg.unidad) COLLATE utf8mb4_unicode_ci,
    pg.responsable
FROM ProduccionGanadera pg;

-- ============================================================
-- VISTA: CÁLCULO DEL ÍNDICE DE ESTADO DEL ANIMAL
-- Reglas (solo animales ACTIVOS):
--   ATENCION    = vacunas/controles vencidos > 0
--                 O incidentes graves sin resolver > 0
--   OBSERVACION = vencimientos en los próximos 15 días > 0
--                 O sin pesaje en los últimos 90 días
--   OPTIMO      = en caso contrario
-- La vista permite auditar POR QUÉ un animal tiene cierto estado.
-- ============================================================
CREATE OR REPLACE VIEW vw_indice_estado AS
SELECT
    a.id_animal,
    a.codigo,
    a.nombre,
    (
        SELECT COUNT(*)
        FROM Vacuna v
        WHERE v.id_animal = a.id_animal
          AND v.proxima_fecha IS NOT NULL
          AND v.proxima_fecha < CURDATE()
    ) + (
        SELECT COUNT(*)
        FROM ControlAnimal c
        WHERE c.id_animal = a.id_animal
          AND c.proxima_fecha IS NOT NULL
          AND c.proxima_fecha < CURDATE()
    ) AS registros_vencidos,
    (
        SELECT COUNT(*)
        FROM Incidente i
        WHERE i.id_animal = a.id_animal
          AND i.gravedad = 'GRAVE'
          AND i.resuelto = FALSE
    ) AS incidentes_graves,
    (
        SELECT COUNT(*)
        FROM Vacuna v
        WHERE v.id_animal = a.id_animal
          AND v.proxima_fecha BETWEEN CURDATE() AND CURDATE() + INTERVAL 15 DAY
    ) + (
        SELECT COUNT(*)
        FROM ControlAnimal c
        WHERE c.id_animal = a.id_animal
          AND c.proxima_fecha BETWEEN CURDATE() AND CURDATE() + INTERVAL 15 DAY
    ) AS vencimientos_proximos,
    COALESCE(
        (SELECT MAX(p.fecha) FROM Pesaje p WHERE p.id_animal = a.id_animal),
        NULL
    ) AS ultimo_pesaje,
    DATEDIFF(
        CURDATE(),
        COALESCE(
            (SELECT MAX(p.fecha) FROM Pesaje p WHERE p.id_animal = a.id_animal),
            a.fecha_ingreso
        )
    ) AS dias_sin_pesaje,
    CASE
        WHEN (
                SELECT COUNT(*)
                FROM Vacuna v
                WHERE v.id_animal = a.id_animal
                  AND v.proxima_fecha IS NOT NULL
                  AND v.proxima_fecha < CURDATE()
             ) + (
                SELECT COUNT(*)
                FROM ControlAnimal c
                WHERE c.id_animal = a.id_animal
                  AND c.proxima_fecha IS NOT NULL
                  AND c.proxima_fecha < CURDATE()
             ) > 0
          OR (
                SELECT COUNT(*)
                FROM Incidente i
                WHERE i.id_animal = a.id_animal
                  AND i.gravedad = 'GRAVE'
                  AND i.resuelto = FALSE
             ) > 0
            THEN 'ATENCION'
        WHEN (
                SELECT COUNT(*)
                FROM Vacuna v
                WHERE v.id_animal = a.id_animal
                  AND v.proxima_fecha BETWEEN CURDATE() AND CURDATE() + INTERVAL 15 DAY
             ) + (
                SELECT COUNT(*)
                FROM ControlAnimal c
                WHERE c.id_animal = a.id_animal
                  AND c.proxima_fecha BETWEEN CURDATE() AND CURDATE() + INTERVAL 15 DAY
             ) > 0
          OR DATEDIFF(
                CURDATE(),
                COALESCE(
                    (SELECT MAX(p.fecha) FROM Pesaje p WHERE p.id_animal = a.id_animal),
                    a.fecha_ingreso
                )
             ) > 90
            THEN 'OBSERVACION'
        ELSE 'OPTIMO'
    END AS estado_indice
FROM Animal a
WHERE a.estado_animal = 'ACTIVO';

-- ============================================================
-- DATOS DE PRUEBA (opcionales)
-- Contraseña de ejemplo: AgroControl1!  (hash bcrypt, costo 12)
-- El usuario admin debe crearse también con la API de registro
-- o mediante este INSERT una vez creada la base de datos.
-- ============================================================
-- INSERT INTO Finca (nombre, ubicacion, tipo_produccion)
-- VALUES ('Finca La Esperanza', 'Zona Norte', 'MIXTA');
--
-- INSERT INTO Usuario (nombre, correo, password, rol, creado_por)
-- VALUES (
--     'Administrador',
--     'admin@agrocontrol.test',
--     '$2b$12$c9RW6ijSbZdc8713rhPdGecM6j8evZBkYxEWmU6rSvP4wrXQqnCs.',
--     'ADMIN',
--     NULL
-- );
