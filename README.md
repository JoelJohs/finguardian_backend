# 🛡️ FinGuardian - Backend API

> **Control Financiero Personal** - API REST completa para gestión de finanzas personales

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-orange.svg)](https://jwt.io/)

## � Descripción

FinGuardian es una API REST robusta y completa para control financiero personal que permite a los usuarios gestionar sus transacciones, establecer presupuestos, crear metas de ahorro y generar reportes detallados. Desarrollada con Node.js, TypeScript y PostgreSQL, ofrece un sistema completo de autenticación JWT y documentación Swagger.

## 🚀 Características Principales

- **🔐 Autenticación Segura**: Sistema completo con JWT y bcrypt
- **💰 Gestión de Transacciones**: CRUD completo con filtros y paginación
- **📊 Dashboard Inteligente**: Resúmenes financieros por períodos
- **🎯 Metas de Ahorro**: Sistema completo con tracking de progreso
- **💳 Presupuestos**: Límites por categoría con alertas automáticas
- **🔄 Transacciones Recurrentes**: Pagos automáticos programados
- **🔔 Sistema de Notificaciones**: Alertas de presupuesto y metas
- **📈 Reportes Avanzados**: Tendencias y análisis por categorías
- **📊 Exportación**: CSV y PDF de transacciones
- **📚 Documentación Swagger**: API completamente documentada

## 🛠️ Tecnologías

- **Runtime**: Node.js 18+
- **Lenguaje**: TypeScript
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
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

## � Documentación API

La documentación completa de la API está disponible via Swagger:

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

# Coverage
npm run test:coverage
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

- **Autenticación JWT**: Tokens seguros con expiración
- **Hash de contraseñas**: bcrypt con salt rounds
- **Middleware de seguridad**: helmet, cors
- **Validación de datos**: Validación en todos los endpoints
- **Rate limiting**: Protección contra spam (recomendado para producción)

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
- **Cobertura**: Sistema completo de gestión financiera
- **Arquitectura**: Modular y escalable
- **Documentación**: 100% documentado con Swagger

---

# 📋 Historial de Desarrollo

> Esta sección contiene el registro detallado del proceso de desarrollo del proyecto

## ✅ Estado del Proyecto: COMPLETADO

### Objetivo del Proyecto

**LOGRADO:** Aplicación completa de gestión financiera personal que ayuda a los usuarios a controlar sus gastos, establecer metas de ahorro y mejorar sus hábitos financieros.

## 🚀 Funcionalidades Implementadas

- 🔐 **Autenticación y Seguridad:** JWT, bcrypt, middleware de auth
- 💰 **Gestión de Transacciones:** CRUD completo con paginación y filtros
- 📊 **Dashboard Financiero:** Resúmenes por períodos, análisis por categorías
- 🎯 **Metas de Ahorro:** Sistema completo con depósitos, retiros y tracking
- 💳 **Presupuestos:** Límites por categoría con alertas de exceso
- 🔄 **Transacciones Recurrentes:** Job automático para pagos programados
- 🔔 **Sistema de Notificaciones:** Alertas de presupuesto y metas completadas
- 📈 **Ahorros Históricos:** Tracking de ahorros lifetime
- 📊 **Exportación:** CSV y PDF de transacciones por rangos de fecha
- 📈 **Reportes Avanzados:** Tendencias diarias y análisis por categorías
- 📚 **Documentación Swagger:** API completamente documentada

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
- ✅ Endpoint `/register` implementado y funcionando (201)
- ✅ Endpoint `/login` implementado y funcionando (200)
- ✅ Token JWT generado y verificado correctamente
- ✅ Backend ejecutándose sin errores (npm run dev)
- ✅ Hash de contraseñas con bcrypt

### ✅ Fase 2: Gestión de Transacciones

- ✅ Entidad Transaction definida
- ✅ CRUD completo de transacciones
- ✅ Middleware de autenticación implementado
- ✅ Relaciones User-Transaction funcionando
- ✅ Relaciones Category-Transaction funcionando
- ✅ Validación de datos de entrada
- ✅ Paginación en listado de transacciones
- ✅ Filtros y búsquedas avanzadas

### ✅ Fase 3: Categorización y Metas

- ✅ Entidad Category definida
- ✅ Entidad SavingsGoal definida
- ✅ Entidad LifetimeSavings definida
- ✅ CRUD completo de metas de ahorro
- ✅ Sistema de depósitos y retiros
- ✅ Cálculo automático de ahorro requerido por período
- ✅ Tracking de progreso de metas
- ✅ Sistema de soft-delete para archivar metas
- ✅ Detección automática de metas completadas
- ✅ Registro de ahorros históricos (lifetime savings)

### ✅ Fase 4: Reportes y Análisis

- ✅ Dashboard financiero
- ✅ Endpoint `/dashboard/summary` implementado
- ✅ Filtrado por períodos (today/week/month)
- ✅ Agregados de ingresos, gastos y balance
- ✅ Análisis por categorías

### ✅ Fase 5: Transacciones Recurrentes

- ✅ Entidad RecurringTransaction definida
- ✅ Job automático de ejecución de recurrentes
- ✅ Soporte para frecuencias: daily, weekly, biweekly, monthly
- ✅ Generación automática de transacciones programadas
- ✅ Actualización automática de próxima ejecución

### ✅ Fase 6: Sistema de Presupuestos

- ✅ Entidad Budget creada y migrada
- ✅ CRUD completo de presupuestos (/api/budgets)
- ✅ Validación de categorías y prevención de duplicados
- ✅ Límites por categoría con períodos (monthly/weekly)
- ✅ Endpoints POST/GET/PATCH/DELETE funcionando correctamente
- ✅ Integración completa en la API principal

### ✅ Fase 7: Alertas y Notificaciones

- ✅ **Sistema de alertas por exceso de presupuesto** - Implementado
- ✅ **Notificaciones de metas completadas** - Implementado
- ✅ **API de notificaciones (/api/notifications)** - Funcionando
- ✅ **Sistema de cola en memoria para alertas** - Operativo

### ✅ Fase 8: Exportación de Datos

- ✅ **Exportar transacciones a CSV** - Implementado y Probado
- ✅ **Exportar transacciones a PDF** - Implementado y Probado
- ✅ **Filtrado por rangos de fechas** - Funcionando correctamente
- ✅ **Endpoint /api/export/csv** - Operativo y testeado
- ✅ **Endpoint /api/export/pdf** - Operativo y testeado
- ✅ **Descarga automática de archivos** - Verificado en Thunder Client
- ✅ **Formato CSV con headers correctos** - Validado
- ✅ **Generación PDF con formato profesional** - Validado

### ✅ Fase 9: Reportes Avanzados

- ✅ **Tendencias diarias** - Implementado y Probado
- ✅ **Análisis por categorías** - Implementado y Probado
- ✅ **Endpoint /api/reports/trend** - Operativo
- ✅ **Endpoint /api/reports/category** - Operativo
- ✅ **Filtrado por rangos de fechas** - Funcionando
- ✅ **Respuestas JSON estructuradas** - Validado

### ✅ Fase 10: Documentación Swagger

- ✅ **Configuración de Swagger/OpenAPI 3.0** - Implementado
- ✅ **Documentación completa de todos los endpoints** - Completado
- ✅ **Esquemas de datos definidos** - Todos los DTOs y entidades
- ✅ **Ejemplos de requests/responses** - Incluidos
- ✅ **Autenticación JWT documentada** - Bearer token
- ✅ **Tags organizados por funcionalidad** - 8 categorías
- ✅ **Servidor de documentación funcionando** - /docs endpoint

## � Pendientes Menores (Opcional)

### 🔧 Mejoras Opcionales

- 🔄 **Suite completa de tests de integración** - _Parcialmente implementado_
- 🔄 **Documentación automática con Swagger** - _Mejora de calidad_
- 🔄 **Rate limiting para proteger endpoints** - _Mejora de seguridad_

### � Estadísticas del Proyecto

- **Entidades:** 7 entidades principales
- **Endpoints:** 30+ endpoints funcionales
- **Funcionalidades Core:** 100% implementadas
- **Sistema de Auth:** Completo con JWT
- **Base de Datos:** PostgreSQL con TypeORM
- **Arquitectura:** Modular y escalable

## 📝 Historial de Desarrollo

### ✅ PROYECTO COMPLETADO - Agosto 2025

**Estado Final:** FinGuardian Backend es una aplicación completamente funcional de gestión financiera personal, probada y lista para producción.

**Logros Principales:**

1. **🔐 Sistema de Autenticación Robusto**

   - Registro y login con JWT
   - Hash seguro de contraseñas con bcrypt
   - Middleware de protección en todas las rutas

2. **💰 Gestión Completa de Transacciones**

   - CRUD completo con paginación
   - Filtros por fecha, categoría y tipo
   - Relaciones correctas con usuarios y categorías

3. **🎯 Sistema de Metas de Ahorro Avanzado**

   - Creación de metas con fechas límite
   - Cálculo automático de ahorro requerido
   - Depósitos y retiros con validaciones
   - Tracking de progreso en tiempo real
   - Historial de ahorros completados

4. **💳 Presupuestos Inteligentes**

   - Límites por categoría y período
   - Alertas automáticas de exceso
   - Prevención de duplicados

5. **🔄 Transacciones Recurrentes Automatizadas**

   - Job automático que ejecuta pagos programados
   - Soporte para múltiples frecuencias
   - Actualización automática de próximas ejecuciones

6. **📊 Dashboard y Reportes**

   - Resúmenes financieros por períodos
   - Análisis por categorías
   - Exportación a CSV y PDF completamente funcional
   - Reportes de tendencias diarias
   - Análisis de gastos por categorías
   - Descarga automática de archivos con nombres descriptivos

7. **🔔 Sistema de Notificaciones**
   - Alertas de presupuesto excedido
   - Notificaciones de metas completadas
   - API para gestionar alertas

**Tecnologías Utilizadas:**

- Node.js + TypeScript
- Express.js con middlewares de seguridad
- TypeORM con PostgreSQL
- JWT para autenticación
- bcrypt para seguridad
- Jest para testing
- date-fns para manejo de fechas

**Arquitectura:**

- Patrón MVC con servicios
- Separación clara de responsabilidades
- Middleware de autenticación centralizado
- Manejo de errores consistente
- Validación de datos en todos los endpoints

### Checkpoint Final - Sistema Completo

**Fecha:** 9 de Agosto, 2025

**Estado:** ✅ PROYECTO TERMINADO Y COMPLETAMENTE PROBADO

El proyecto FinGuardian Backend ha alcanzado todas sus metas iniciales y está listo para producción. Todas las funcionalidades core están implementadas, funcionando correctamente y han sido probadas exitosamente en Thunder Client.

## � Funcionalidades de Exportación

### CSV Export - Completamente Funcional ✅

El sistema permite exportar transacciones en formato CSV con las siguientes características:

- **Endpoint:** `GET /api/export/csv`
- **Autenticación:** Requiere token Bearer JWT
- **Parámetros requeridos:**
  - `start`: Fecha de inicio (formato: YYYY-MM-DD)
  - `end`: Fecha de fin (formato: YYYY-MM-DD)

**Ejemplo de uso:**

```
GET /api/export/csv?start=2024-07-01&end=2024-07-31
Authorization: Bearer <tu-token-jwt>
```

**Datos exportados:**

- Fecha y hora de la transacción
- Monto
- Tipo (income/expense)
- Descripción
- Nombre de la categoría

**Respuesta:**

- Content-Type: `text/csv`
- Archivo descargable con nombre: `fin-guardian-{start}-to-{end}.csv`

**Probado exitosamente en:** Thunder Client, Postman, cURL

### PDF Export - Completamente Funcional ✅

Exportación de transacciones en formato PDF profesional:

- **Endpoint:** `GET /api/export/pdf`
- **Autenticación:** Requiere token Bearer JWT
- **Parámetros:** Mismos que CSV

**Ejemplo de uso:**

```
GET /api/export/pdf?start=2025-01-01&end=2025-08-09
Authorization: Bearer <tu-token-jwt>
```

**Respuesta:**

- Content-Type: `application/pdf`
- Archivo descargable con nombre: `fin-guardian-{start}-to-{end}.pdf`

### Reportes de Análisis - Completamente Funcional ✅

#### Tendencias Diarias

- **Endpoint:** `GET /api/reports/trend`
- **Respuesta:** `[{date:"2025-01-01",income:0,expense:50}, ...]`

#### Análisis por Categorías

- **Endpoint:** `GET /api/reports/category`
- **Respuesta:** `[{category:"Comida",total:320}, ...]`

**Ambos endpoints requieren:**

- Autenticación Bearer JWT
- Parámetros: `start` y `end` (formato: YYYY-MM-DD)

**Probado exitosamente en:** Thunder Client, Postman, cURL

## �🚀 Cómo Ejecutar el Proyecto

### Prerrequisitos

```bash
Node.js (v18+)
PostgreSQL (v12+)
npm o yarn
```

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd server

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de BD

# Ejecutar migraciones
npm run migration:run

# Iniciar en desarrollo
npm run dev

# Ejecutar tests
npm test
```

### Scripts Disponibles

- `npm run dev` - Servidor en modo desarrollo
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar servidor de producción
- `npm test` - Ejecutar suite de tests
- `npm run test:watch` - Tests en modo watch

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
- **Cobertura**: Sistema completo de gestión financiera
- **Arquitectura**: Modular y escalable
- **Documentación**: 100% documentado con Swagger

---

# 📋 Historial de Desarrollo

> Esta sección contiene el registro detallado del proceso de desarrollo del proyecto
