# 🛡️ FinGuardian - Backend API

> **Control Financiero Personal** - API REST para gestión de finanzas personales

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express.js-5.x-lightgrey.svg)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-orange.svg)](https://jwt.io/)

## 📖 Descripción

FinGuardian es una API REST para control financiero personal que permite gestionar transacciones, establecer presupuestos, crear metas de ahorro y generar reportes. Desarrollada con Node.js, TypeScript y PostgreSQL, incluye autenticación JWT y documentación Swagger.

## 🚀 Características Principales

- **🔐 Autenticación**: Sistema con JWT y bcrypt
- **💰 Gestión de Transacciones**: CRUD con filtros y paginación
- **📊 Dashboard**: Resúmenes financieros por períodos
- **🎯 Metas de Ahorro**: Sistema con tracking de progreso
- **💳 Presupuestos**: Límites por categoría con alertas
- **🔄 Transacciones Recurrentes**: Pagos automáticos programados
- **🔔 Notificaciones**: Alertas de presupuesto y metas
- **📈 Reportes**: Tendencias y análisis por categorías
- **📊 Exportación**: CSV y PDF de transacciones
- **📚 Documentación**: API documentada con Swagger

## 🛠️ Tecnologías

- **Runtime**: Node.js 18+
- **Lenguaje**: TypeScript 5.8+
- **Framework**: Express.js 5.x
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM 0.3+
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcrypt, helmet, cors
- **Documentación**: Swagger/OpenAPI 3.0
- **Testing**: Jest
- **Utilidades**: date-fns, json2csv, pdfkit

## 📂 Estructura del Proyecto

```
src/
├── config/          # Configuración de base de datos
├── entities/        # Entidades TypeORM
├── routes/          # Endpoints de la API
├── services/        # Lógica de negocio
├── middlewares/     # Middlewares personalizados
├── dto/             # Data Transfer Objects
├── utils/           # Utilidades generales
├── jobs/            # Tareas programadas
└── docs/            # Documentación Swagger
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18 o superior
- PostgreSQL 12 o superior
- npm o yarn

### Instalación

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/JoelJohs/fitguardian_backend.git
   cd fitguardian_backend
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con tus configuraciones:

   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=finguardian
   JWT_SECRET=your_jwt_secret_key
   PORT=3001
   ```

4. **Ejecutar migraciones**

   ```bash
   npm run migration:run
   ```

5. **Iniciar el servidor**

   ```bash
   # Desarrollo
   npm run dev

   # Producción
   npm run build
   npm start
   ```

## 📚 Documentación API

La documentación de la API está disponible via Swagger:

- **Local**: http://localhost:3001/docs
- **Producción**: https://api.finguardian.com/docs

### Endpoints Principales

#### Autenticación

- `POST /api/users/register` - Registro de usuario
- `POST /api/users/login` - Inicio de sesión

#### Transacciones

- `GET /api/transactions` - Listar transacciones (paginado)
- `POST /api/transactions` - Crear transacción
- `GET /api/transactions/:id` - Obtener transacción
- `PATCH /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción

#### Presupuestos

- `GET /api/budgets` - Listar presupuestos
- `POST /api/budgets` - Crear presupuesto
- `PATCH /api/budgets/:id` - Actualizar presupuesto
- `DELETE /api/budgets/:id` - Eliminar presupuesto

#### Metas de Ahorro

- `GET /api/savings-goals` - Listar metas
- `POST /api/savings-goals` - Crear meta
- `GET /api/savings-goals/:id/progress` - Ver progreso
- `PATCH /api/savings-goals/:id/deposit` - Realizar depósito
- `PATCH /api/savings-goals/:id/withdraw` - Realizar retiro

#### Dashboard y Reportes

- `GET /api/dashboard/summary` - Resumen financiero
- `GET /api/reports/trend` - Tendencias diarias
- `GET /api/reports/category` - Análisis por categorías
- `GET /api/export/csv` - Exportar a CSV
- `GET /api/export/pdf` - Exportar a PDF

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## 🗄️ Base de Datos

### Entidades Principales

- **User**: Usuarios del sistema
- **Transaction**: Transacciones financieras
- **Category**: Categorías de transacciones
- **Budget**: Presupuestos por categoría
- **SavingsGoal**: Metas de ahorro
- **LifetimeSavings**: Historial de ahorros
- **RecurringTransaction**: Transacciones recurrentes

### Migraciones

```bash
# Crear nueva migración
npm run migration:create -- -n NombreMigracion

# Ejecutar migraciones
npm run migration:run

# Revertir migración
npm run migration:revert
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor en modo desarrollo
- `npm run build` - Compilar TypeScript
- `npm start` - Servidor de producción
- `npm test` - Ejecutar tests
- `npm run migration:run` - Ejecutar migraciones
- `npm run migration:revert` - Revertir migración

## 🔒 Seguridad

- **Autenticación JWT**: Tokens con expiración
- **Hash de contraseñas**: bcrypt con salt rounds
- **Middleware de seguridad**: helmet, cors
- **Validación de datos**: Validación en todos los endpoints

## 🌐 Despliegue

### Variables de Entorno de Producción

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your_secure_jwt_secret
PORT=3001
```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👤 Autor

**Joel Johns**

- GitHub: [@JoelJohs](https://github.com/JoelJohs)
- Proyecto: [FinGuardian Backend](https://github.com/JoelJohs/fitguardian_backend)

---

## 📊 Estadísticas del Proyecto

- **Entidades**: 7 entidades principales
- **Endpoints**: 30+ endpoints documentados
- **Cobertura**: Sistema de gestión financiera
- **Arquitectura**: Modular y escalable
- **Documentación**: Documentado con Swagger

---

# 📋 Historial de Desarrollo

> Esta sección contiene el registro detallado del proceso de desarrollo del proyecto

## ✅ Estado del Proyecto: COMPLETADO

### Objetivo del Proyecto

**LOGRADO:** Aplicación de gestión financiera personal que ayuda a controlar gastos, establecer metas de ahorro y mejorar hábitos financieros.

## 🚀 Funcionalidades Implementadas

- 🔐 **Autenticación y Seguridad:** JWT, bcrypt, middleware de auth
- 💰 **Gestión de Transacciones:** CRUD con paginación y filtros
- 📊 **Dashboard Financiero:** Resúmenes por períodos, análisis por categorías
- 🎯 **Metas de Ahorro:** Sistema con depósitos, retiros y tracking
- 💳 **Presupuestos:** Límites por categoría con alertas de exceso
- 🔄 **Transacciones Recurrentes:** Job automático para pagos programados
- 🔔 **Sistema de Notificaciones:** Alertas de presupuesto y metas completadas
- 📈 **Ahorros Históricos:** Tracking de ahorros lifetime
- 📊 **Exportación:** CSV y PDF de transacciones por rangos de fecha
- 📈 **Reportes:** Tendencias diarias y análisis por categorías
- 📚 **Documentación Swagger:** API documentada

## 📁 Arquitectura del Proyecto

```
📦 FinGuardian Backend
├── 🗄️  src/
│   ├── 🔧 config/database.ts          # Configuración TypeORM
│   ├── 📋 entities/                   # Entidades de base de datos
│   │   ├── User.ts                   # Usuario con auth
│   │   ├── Transaction.ts            # Transacciones principales
│   │   ├── Category.ts               # Categorías de gastos
│   │   ├── SavingsGoal.ts           # Metas de ahorro
│   │   ├── Budget.ts                # Presupuestos por categoría
│   │   ├── LifetimeSavings.ts       # Historial de ahorros
│   │   └── RecurringTransaction.ts   # Transacciones automáticas
│   ├── 🛣️  routes/                    # Endpoints de la API
│   │   ├── user.routes.ts           # /register, /login
│   │   ├── transaction.route.ts     # CRUD transacciones
│   │   ├── dashboard.routes.ts      # /summary con filtros
│   │   ├── saving.routes.ts         # Metas de ahorro
│   │   ├── budget.routes.ts         # Gestión de presupuestos
│   │   ├── lifetime.routes.ts       # Historial de ahorros
│   │   ├── notification.routes.ts   # Sistema de alertas
│   │   ├── export.routes.ts         # Exportar a CSV
│   │   ├── pdf.routes.ts            # Exportar a PDF
│   │   └── report.routes.ts         # Reportes y análisis
│   ├── 🔧 services/                  # Lógica de negocio
│   ├── 🔒 middlewares/auth.ts        # Verificación JWT
│   ├── ⚙️  jobs/recurring.job.ts     # Transacciones automáticas
│   ├── 📚 docs/swagger.ts            # Configuración Swagger
│   └── 🛠️  utils/auth.ts             # Utilidades de auth
├── 🧪 __tests__/                     # Suite de testing
└── 📦 Configuración (package.json, tsconfig, etc.)
```

## 🏗️ Fases de Desarrollo Completadas

### ✅ Fase 1: Setup Inicial y Autenticación

- ✅ Configuración del proyecto TypeScript + Node.js
- ✅ Dependencias instaladas sin errores
- ✅ Configuración de TypeORM
- ✅ Entidad User definida
- ✅ Endpoints `/register` y `/login` implementados
- ✅ Token JWT generado y verificado correctamente
- ✅ Hash de contraseñas con bcrypt

### ✅ Fase 2: Gestión de Transacciones

- ✅ Entidad Transaction definida
- ✅ CRUD de transacciones
- ✅ Middleware de autenticación implementado
- ✅ Relaciones User-Transaction funcionando
- ✅ Validación de datos de entrada
- ✅ Paginación en listado de transacciones

### ✅ Fase 3: Categorización y Metas

- ✅ Entidades Category, SavingsGoal y LifetimeSavings definidas
- ✅ CRUD de metas de ahorro
- ✅ Sistema de depósitos y retiros
- ✅ Tracking de progreso de metas
- ✅ Detección automática de metas completadas

### ✅ Fase 4: Reportes y Análisis

- ✅ Dashboard financiero
- ✅ Endpoint `/dashboard/summary` implementado
- ✅ Filtrado por períodos (today/week/month)
- ✅ Análisis por categorías

### ✅ Fase 5: Transacciones Recurrentes

- ✅ Entidad RecurringTransaction definida
- ✅ Job automático de ejecución de recurrentes
- ✅ Soporte para múltiples frecuencias
- ✅ Generación automática de transacciones programadas

### ✅ Fase 6: Sistema de Presupuestos

- ✅ Entidad Budget creada
- ✅ CRUD de presupuestos (/api/budgets)
- ✅ Validación de categorías
- ✅ Límites por categoría con períodos (monthly/weekly)

### ✅ Fase 7: Alertas y Notificaciones

- ✅ Sistema de alertas por exceso de presupuesto
- ✅ Notificaciones de metas completadas
- ✅ API de notificaciones (/api/notifications)

### ✅ Fase 8: Exportación de Datos

- ✅ Exportar transacciones a CSV
- ✅ Exportar transacciones a PDF
- ✅ Filtrado por rangos de fechas
- ✅ Descarga automática de archivos

### ✅ Fase 9: Reportes Avanzados

- ✅ Tendencias diarias
- ✅ Análisis por categorías
- ✅ Endpoints /api/reports/trend y /api/reports/category

### ✅ Fase 10: Documentación Swagger

- ✅ Configuración de Swagger/OpenAPI 3.0
- ✅ Documentación de todos los endpoints
- ✅ Esquemas de datos definidos
- ✅ Ejemplos de requests/responses
- ✅ Servidor de documentación funcionando (/docs)

## 📊 Funcionalidades de Exportación

### CSV Export ✅

- **Endpoint:** `GET /api/export/csv`
- **Parámetros:** `start` y `end` (formato: YYYY-MM-DD)
- **Autenticación:** Bearer JWT requerido

### PDF Export ✅

- **Endpoint:** `GET /api/export/pdf`
- **Parámetros:** `start` y `end` (formato: YYYY-MM-DD)
- **Autenticación:** Bearer JWT requerido

### Reportes de Análisis ✅

- **Tendencias:** `GET /api/reports/trend`
- **Categorías:** `GET /api/reports/category`

## 📈 Estadísticas Finales

- **Entidades:** 7 entidades principales
- **Endpoints:** 30+ endpoints funcionales
- **Funcionalidades:** Sistema completo implementado
- **Arquitectura:** Modular y escalable
- **Documentación:** Swagger integrado

## 🎉 Estado Final

**Fecha de Finalización:** 9 de Agosto, 2025

**Estado:** ✅ PROYECTO COMPLETADO

FinGuardian Backend ha alcanzado todas sus metas iniciales y está listo para producción. Todas las funcionalidades están implementadas, funcionando correctamente y han sido probadas exitosamente.

### Tecnologías Utilizadas:

- Node.js + TypeScript
- Express.js con middlewares de seguridad
- TypeORM con PostgreSQL
- JWT para autenticación
- bcrypt para seguridad
- Swagger para documentación
- Jest para testing

### Arquitectura Final:

- Patrón MVC con servicios
- Separación clara de responsabilidades
- Middleware de autenticación centralizado
- Manejo de errores consistente
- Validación de datos en todos los endpoints

**🎯 FinGuardian Backend - Proyecto Completado con Éxito**

_Una aplicación funcional para la gestión financiera personal, completamente documentada._
