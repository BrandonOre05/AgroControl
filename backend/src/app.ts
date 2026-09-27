// ============================================================
// app.ts
// Configura la aplicación Express: CORS, lectura del JSON,
// las rutas y el manejo de errores.
//
// Aquí NO se pone a escuchar el servidor (eso lo hace server.ts),
// para poder probar la app sin abrir un puerto real.
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, rutaNoEncontrada } from './middlewares/ErrorMiddleware';
import authRoutes from './routes/AuthRoutes';
import fincaRoutes from './routes/FincaRoutes';
import animalRoutes from './routes/AnimalRoutes';
import saludRoutes from './routes/SaludRoutes';
import saludResumenRoutes from './routes/SaludResumenRoutes';
import usuarioRoutes from './routes/UsuarioRoutes';
import alertaRoutes from './routes/AlertaRoutes';
import dashboardRoutes from './routes/DashboardRoutes';
import cultivoRoutes from './routes/CultivoRoutes';
import inventarioRoutes from './routes/InventarioRoutes';
import produccionRoutes from './routes/ProduccionRoutes';
import actividadRoutes from './routes/ActividadRoutes';
import reporteRoutes from './routes/ReporteRoutes';
import alimentacionRoutes from './routes/AlimentacionRoutes';

const app = express();

// --- Middlewares generales ---

// helmet: agrega cabeceras de seguridad a TODAS las respuestas
// (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc.).
// Sin esto, un navegador confía en lo que la API le devuelve.
//
// La opción crossOriginResourcePolicy es necesaria porque el
// frontend corre en otro origen (localhost:4200) que este API
// (localhost:3000). Con el valor por defecto ("same-origin") el
// navegador bloquearía la respuesta y la app no funcionaría.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Límite general de peticiones: evita que alguien abuse de la API
// con miles de requests (por ejemplo, un bucle infinito en el
// frontend). Son 300 peticiones cada 15 minutos por IP, un margen
// holgado para el uso normal de la app.
//
// El login tiene SU PROPIO límite, más estricto (10 intentos), en
// AuthRoutes. Aquí se excluye para que ese sea el único que
// cuentan los intentos de acceso.
const limiteGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/api/auth/login',
  message: {
    mensaje: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
  },
});

app.use(limiteGeneral);

// CORS: permite llamadas SOLO desde el origen configurado (el frontend).
// En producción nunca se usa "*", porque abriría la API a cualquier sitio.
app.use(cors({ origin: env.corsOrigin }));

// Permite leer el cuerpo JSON de las peticiones (req.body)
app.use(express.json());

// --- Rutas ---

// Ruta rápida para comprobar que la API está viva:
// GET http://localhost:3000/api/health
app.get('/api/health', (_req, res) => {
  res.json({
    mensaje: 'AgroControl API funcionando',
    hora: new Date().toISOString(),
  });
});

// Módulos de la API
app.use('/api/auth', authRoutes);
app.use('/api/finca', fincaRoutes);
app.use('/api/animales', animalRoutes);
app.use('/api/animales', saludRoutes);
app.use('/api/salud', saludResumenRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cultivos', cultivoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/actividades', actividadRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/alimentacion', alimentacionRoutes);

// Si ninguna ruta coincidió -> 404
app.use(rutaNoEncontrada);

// IMPORTANTE: el manejador de errores va al final de todo
app.use(errorHandler);

export default app;
