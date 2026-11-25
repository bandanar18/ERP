<div align="center">
  <img src="./apps/frontend/src/assets/business.webp" alt="Business & Development — Venezuela Logo" width="220" />
  <h1>Business ERP - Monorepositorio</h1>
  <p><b>Un sistema ERP modular de alto rendimiento</b></p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
  [![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)
  [![Expo](https://img.shields.io/badge/Expo-Mobile-000020?style=flat-square&logo=expo)](https://expo.dev/)
</div>

<br/>

Plataforma ERP (Enterprise Resource Planning) en monorepo, con módulos independientes para **gestión de proyectos**, **control de calidad** y **seguimiento ejecutivo**. Cada módulo tiene su propio dominio, autenticación y base de datos (tablas con prefijo propio).

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Monorepo | pnpm workspaces + Turborepo + TypeScript |
| Backend | Express 5 + Prisma 7 (PostgreSQL) |
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| Móvil | Expo (React Native) |
| Deploy | Railway (Dockerfile multi-stage) + Cloudflare DNS |

## Módulos del ERP

Cada módulo es independiente: tiene su propio schema, auth (JWT propio) y tablas con prefijo propio en la misma base de datos PostgreSQL.

| Módulo | Prefijo DB | Subdominio | Descripción |
|--------|-----------|-----------|-------------|
| **Core ERP** | `erp_` | `bdgestion.org` | Auth, usuarios, roles y membresías del ERP base |
| **Project Management** | `pm_` | `proyectos.bdgestion.org` | Proyectos, avance físico, costos, valuaciones financieras, galería y usuarios del módulo |
| **Quality Control** | `qc_` | `calidad.bdgestion.org` | Indicadores, mediciones, procesos, reportes y auditoría de calidad |
| **Executive** | `executive_` | — | Sistema de seguimiento de indicadores ejecutivo |

> Los subdominios se sirven desde un único deploy (routing por host en el SPA). La landing vive en `bdgestion.org` / `www.bdgestion.org`.

## Estructura del monorepo

```mermaid
graph TD
    A[Monorepo - Turborepo] --> B(apps/frontend)
    A --> C(apps/backend)
    A --> D(apps/business-erp-app)
    
    B --> B1[React SPA]
    B1 --> B2[TailwindCSS]
    B1 --> B3[Vite]
    
    C --> C1[Express.js API]
    C1 --> C2[Clean Architecture]
    C2 --> C3[Prisma ORM]
    C3 --> C4[(PostgreSQL)]
    
    D --> D1[React Native]
    D1 --> D2[Expo]
```

```
Proyecto Business ERP/
├── apps/
│   ├── backend/              # Express + Prisma (Clean/Hexagonal)
│   │   ├── prisma/
│   │   │   ├── schema/       # Schema multi-archivo (auth, project-management, quality-control, executive)
│   │   │   └── migrations/   # Migraciones
│   │   ├── src/
│   │   │   ├── modules/      # Módulos (Clean/Hexagonal: domain, application, infrastructure, interface)
│   │   │   │   ├── project-management/
│   │   │   │   └── quality-control/
│   │   │   ├── features/     # Features legacy (auth, companies, projects, executive, ...)
│   │   │   └── config/       # Configuración (database, paths, redis, ...)
│   │   └── scripts/          # Scripts de mantenimiento y diagnóstico
│   ├── frontend/             # React + Vite
│   │   └── src/
│   │       ├── features/     # project-management, quality-control, executive, auth
│   │       ├── pages/        # Landing page
│   │       ├── routes/       # Routing (incluye routing por subdominio)
│   │       └── config/       # Config de dominios/subdominios
│   └── business-erp-app/     # App móvil (Expo / React Native)
├── scripts/                  # Scripts de fix/migración del monorepo
├── Dockerfile                # Build multi-stage para Railway
├── railway.json              # Config de deploy de Railway
├── turbo.json                # Config de Turborepo (incluye globalEnv)
├── .env.example              # Template de variables de entorno
└── package.json              # Comandos raíz (prisma:*, mobile:*, dev, build, ...)
```

## Arquitectura

### Backend — Clean/Hexagonal

Los módulos nuevos (`project-management`, `quality-control`) siguen Clean/Hexagonal Architecture:

```mermaid
classDiagram
    class Interface {
        +Controllers
        +Routes
        +Middlewares
    }
    class Application {
        +Use Cases
        +Services
        +DTOs
    }
    class Domain {
        +Entities
        +Repositories (Interfaces)
        +Errors
    }
    class Infrastructure {
        +Prisma Repositories
        +Auth (JWT/BCrypt)
        +Storage
    }

    Interface --> Application : HTTP Requests
    Application --> Domain : Business Logic
    Infrastructure ..|> Domain : Implements Repositories
    Application --> Infrastructure : Uses Services
```

```
module/
├── domain/           # Entidades, repositorios (puertos)
├── application/      # Casos de uso y servicios
├── infrastructure/   # Persistencia Prisma, auth (JWT/BCrypt), storage
└── interface/        # Controllers, rutas, middlewares
```

Las features legacy (`features/`) conviven con los módulos y se mantienen por compatibilidad.

### Base de datos — prefijos por módulo

Con solo mirar el nombre de la tabla sabés de qué módulo es:

- `erp_users`, `erp_roles`, `erp_otp_tokens` → core ERP
- `pm_projects`, `pm_companies`, `pm_physical_progress`, `pm_users` → Project Management
- `qc_users`, `qc_indicators`, `qc_measurements` → Quality Control
- `executive_user`, `executive_indicator`, `executive_measurement` → Executive

El schema Prisma es multi-archivo (`prisma/schema/*.prisma`).

## 🔄 Flujo de Datos y Enrutamiento por Subdominio

El sistema atiende diferentes subdominios desde el mismo frontend (SPA). Dependiendo de la URL a la que se ingrese, se monta el módulo correspondiente.

```mermaid
sequenceDiagram
    participant User
    participant Router as Frontend Router (Vite)
    participant API as Backend API (Express)
    participant DB as PostgreSQL (Prisma)

    User->>Router: Accede a proyectos.bdgestion.org
    Router->>Router: Detecta subdominio 'proyectos'
    Router->>User: Renderiza módulo Project Management
    User->>Router: Realiza acción (ej. Crear Proyecto)
    Router->>API: POST /api/project-management/...
    API->>API: Valida token y roles (Middleware)
    API->>API: Ejecuta Caso de Uso (Application)
    API->>DB: Guarda datos vía Prisma (Infrastructure)
    DB-->>API: Retorna resultado
    API-->>Router: Responde 200 OK
    Router-->>User: Muestra notificación de éxito
```

## 👥 Flujos y Permisos por Rol de Usuario

El sistema aísla los datos y las capacidades según el Rol del usuario. Aquí se detalla exactamente el ciclo de vida y los flujos de trabajo que ejecuta cada perfil existente.

### 🏗️ Usuarios de Project Management

#### 1. Administrador / Gestión (`PM_ADMIN` / `PM_GESTION`)
Es el perfil de más alto nivel de control (backoffice).
**Flujo Operativo Paso a Paso:**
1. **Configuración Inicial:** Da de alta las **Empresas** clientes en el sistema.
2. **Creación de Proyectos:** Crea los **Proyectos** y los vincula a la Empresa.
3. **Planificación:** Carga la valuación financiera y los costos estimados distribuidos en el tiempo.
4. **Asignación de Personal:**
   - Asigna un usuario `PM_PLANIFICADOR` (Ingeniero/Responsable) al proyecto.
   - Vincula usuarios `PM_CLIENTE` a la empresa cliente.
5. **Supervisión Global:** Tiene vista exploratoria para buscar, filtrar y revisar todos los proyectos de todas las empresas, pudiendo editar cualquier dato.

```mermaid
flowchart TD
    A[Login PM_ADMIN] --> B[Dashboard General]
    B --> C[Gestión de Empresas y Usuarios]
    B --> D[Crear Proyecto]
    D --> E[Cargar Planificación Financiera]
    D --> F[Cargar Costos Estimados]
    D --> G[Asignar Planificador al Proyecto]
    C --> H[Asignar Cliente a Empresa]
```

#### 2. Planificador (`PM_PLANIFICADOR`)
Es el encargado de la ejecución en campo o responsable operativo del proyecto.
**Flujo Operativo Paso a Paso:**
1. **Acceso Limitado (Scope):** Al ingresar, el sistema filtra y *solo le muestra* los proyectos donde ha sido asignado explícitamente. No puede ver datos de otros proyectos ni crear nuevos.
2. **Registro de Avances:** De forma periódica (semanal o mensual), ingresa al detalle de su proyecto y registra el **Avance Físico**. Carga el % real vs el planificado y escribe "Puntos de Atención".
3. **Gestión de Evidencia:** Sube comprobantes fotográficos o archivos PDF a la **Galería** del proyecto para respaldar el avance reportado.

```mermaid
flowchart TD
    A[Login PM_PLANIFICADOR] --> B[Dashboard Personal]
    B --> C[Lista de Mis Proyectos Asignados]
    C --> D[Detalle del Proyecto]
    D --> E[Registrar Avance Físico Periódico]
    D --> F[Subir Evidencia a Galería]
```

#### 3. Cliente (`PM_CLIENTE`)
Es el usuario externo (Inversor o dueño de la Empresa) que necesita monitorear cómo va su inversión.
**Flujo Operativo Paso a Paso:**
1. **Acceso Restringido:** Ingresa y el sistema le muestra *únicamente* los proyectos pertenecientes a su Empresa.
2. **Monitoreo de Curvas (Solo Lectura):** Visualiza un Dashboard Cliente para contrastar las Curvas S: ve si el proyecto está adelantado o atrasado física y financieramente.
3. **Auditoría Visual:** Accede a la Galería para inspeccionar las fotos subidas por el Planificador sin poder borrarlas.

```mermaid
flowchart TD
    A[Login PM_CLIENTE] --> B[Dashboard de la Empresa]
    B --> C[Ver Curvas S Consolidadas]
    B --> D[Explorar Proyectos Propios]
    D --> E[Ver Galería de Fotos del Proyecto]
```

---

### 🔍 Usuarios de Quality Control

#### 4. Administrador de Calidad (`QC_ADMIN`)
Estructura la norma y diseña qué se va a medir.
**Flujo Operativo Paso a Paso:**
1. Crea y parametriza los **Procesos** y Sub-procesos de la organización.
2. Define los **Indicadores (KPIs)** para cada proceso, estableciendo su unidad de medida, metas de cumplimiento y frecuencia.
3. Asigna responsables para que se encarguen de medirlos.

```mermaid
flowchart TD
    A[Login QC_ADMIN] --> B[Diseñar Árbol de Procesos]
    B --> C[Crear KPIs e Indicadores]
    C --> D[Fijar Metas y Frecuencia]
    D --> E[Asignar Evaluadores]
```

#### 5. Evaluador (`QC_EVALUADOR`)
Es el responsable de ingresar el dato real al sistema.
**Flujo Operativo Paso a Paso:**
1. Revisa sus tareas o indicadores asignados pendientes para el mes.
2. Carga la **Medición**, ingresando el valor numérico o resultado en el periodo correspondiente.

```mermaid
flowchart TD
    A[Login QC_EVALUADOR] --> B[Listado de KPIs Asignados]
    B --> C[Cargar Valor de Medición del Periodo]
```

#### 6. Auditor (`QC_AUDITOR`)
Supervisa que la empresa cumpla la norma.
**Flujo Operativo Paso a Paso:**
1. Analiza el tablero global de cumplimiento.
2. Configura los filtros deseados y utiliza el motor interno (Puppeteer) para exportar el Dashboard completo a un **Informe en PDF formal** para presentar en auditorías ISO.

---

### 📊 Usuarios Executive (Directorio)

#### 7. Administrador Ejecutivo (`EXECUTIVE_ADMIN`)
Prepara el panel de la alta gerencia.
**Flujo Operativo:** Carga los indicadores de rentabilidad, estrategia o recursos humanos de altísimo nivel.

#### 8. Visor Ejecutivo (`EXECUTIVE_VIEWER`)
Diseñado para Directores, CEOs o Gerentes Generales.
**Flujo Operativo Paso a Paso:**
1. Accede directo al **Consolidated Report** (Reporte Consolidado).
2. Analiza el semáforo (Verde, Amarillo, Rojo) de los KPIs estratégicos para la toma de decisiones inmediata de la corporación. No carga ni edita nada, solo consume información clave.

## Requisitos previos

- **Node.js 22** (ver `.nvmrc`)
- **pnpm 11** (`corepack enable` si no lo tenés)
- **PostgreSQL** (local o vía Railway)

## 🚀 Instalación y Despliegue Local (Paso a Paso)

Este proyecto utiliza un entorno de desarrollo estructurado en Turborepo. Sigue estos pasos al pie de la letra para levantar el entorno local sin problemas.

> ⚡ **Instalación Rápida (Copiar y Pegar todo en la terminal):**
> ```bash
> git clone https://github.com/dimtha01/Proyecto-Business-ERP.git && cd Proyecto-Business-ERP
> corepack enable && pnpm install
> cp .env.example .env
> # IMPORTANTE: Abre el archivo .env, pon las credenciales de tu DB Postgres, y luego ejecuta:
> pnpm prisma:generate && pnpm prisma:migrate:dev && pnpm prisma:seed:demo
> pnpm dev
> ```

### Paso 1: Requisitos Previos

Asegúrate de tener instalado en tu máquina lo siguiente:
- **Node.js** (Versión 22): Te recomendamos usar `nvm` o `fnm` para gestionar la versión y aplicar el `.nvmrc` del proyecto (`nvm use`).
- **PostgreSQL**: Debes tener un motor de base de datos Postgres corriendo localmente (por ejemplo, en el puerto 5432) o una URL proveída en la nube.
- **pnpm** (Versión 11): Es el gestor de paquetes estricto que usamos en este monorepo. Si tienes Node instalado, actívalo ejecutando:
  ```bash
  corepack enable
  ```

### Paso 2: Clonar el Repositorio

Abre tu terminal y clona el proyecto desde GitHub:
```bash
git clone https://github.com/dimtha01/Proyecto-Business-ERP.git
cd Proyecto-Business-ERP
```

### Paso 3: Instalación de Dependencias

Ejecuta el siguiente comando en la raíz del proyecto. `pnpm` se encargará de instalar las dependencias de todos los workspaces (`apps/frontend`, `apps/backend`, `apps/business-erp-app`) de forma eficiente y linkeada.
```bash
pnpm install
```

### Paso 4: Variables de Entorno

El monorepositorio centraliza la configuración en la raíz (usando la llave `globalEnv` de Turbo).
1. Copia el archivo de ejemplo para crear tu propio entorno local:
   ```bash
   cp .env.example .env
   ```
2. Abre el archivo `.env` en tu editor y configura fundamentalmente la conexión a tu PostgreSQL:
   ```env
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/business_erp?schema=public"
   ```
   *(Nota: Asegúrate de que existan secretos para todos los JWT. Para entorno local, puedes usar valores dummy como en el `.env.example`).*

### Paso 5: Configuración de la Base de Datos (Prisma)

El ORM Prisma necesita compilar sus tipos y estructurar la base de datos elegida:
1. **Generar el cliente Prisma** (crea los tipados TypeScript basados en tu schema multi-archivo):
   ```bash
   pnpm prisma:generate
   ```
2. **Aplicar las migraciones** (esto creará y sincronizará todas las tablas en tu base de datos PostgreSQL):
   ```bash
   pnpm prisma:migrate:dev
   ```
3. *(Opcional pero recomendado)* **Poblar la base de datos (Seed):**
   Para poder loguearte en el sistema sin empezar de cero, necesitas usuarios y datos iniciales. Corre el script para generar un entorno con cuentas de prueba:
   ```bash
   pnpm prisma:seed:demo
   ```

### Paso 6: Levantar el Entorno de Desarrollo

Ya tienes todo listo. Ahora arranca todos los servidores (Vite y Express) al mismo tiempo con un único comando en la raíz:
```bash
pnpm dev
```

El orquestador de Turborepo prenderá los servicios:
- Tu **Frontend (SPA)** estará disponible en: `http://localhost:5173`
- Tu **Backend (API)** estará escuchando en: `http://localhost:3000`

¡Listo! Ya podés abrir el navegador e ingresar con los usuarios de prueba.

## Variables de entorno

Todas las variables se centralizan en un único archivo `.env` en la raíz. Turborepo las inyecta a cada app vía `turbo.json` (`globalEnv`).

> **Nunca** commitear el archivo `.env` con valores reales. Usar `.env.example` como template.

### Backend (Express/Prisma)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `JWT_SECRET` | Secret para access tokens del ERP |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens |
| `ACCESS_TOKEN_EXPIRY` | Vida del access token (ej: `30m`) |
| `REFRESH_TOKEN_EXPIRY` | Vida del refresh token (ej: `7d`) |
| `PM_JWT_SECRET` | JWT del módulo Project Management |
| `PM_JWT_EXPIRES_IN` | Expiración del JWT de PM (ej: `8h`) |
| `QC_JWT_SECRET` | JWT del módulo Quality Control (requerido, fail-fast) |
| `QC_JWT_EXPIRES_IN` | Expiración del JWT de QC (ej: `8h`) |
| `EXECUTIVE_JWT_SECRET` | JWT propio del módulo Executive (requerido, fail-fast) |
| `EXECUTIVE_JWT_EXPIRES_IN` | Expiración del JWT de Executive (ej: `8h`) |
| `PUPPETEER_EXECUTABLE_PATH` | Ruta del navegador para export PDF de QC |
| `UPLOADS_DIR` | Directorio de uploads (gallery/file-gallery). En Railway apunta al volumen persistente |
| `REDIS_URL` | URL de Redis (opcional) |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | Config SMTP |
| `FRONTEND_URL` | URL del frontend (para CORS) |
| `PORT` | Puerto del backend |

### Frontend (Vite/React)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API del backend |

> Vite solo expone variables que empiezan con `VITE_`.

### App móvil (Expo)

| Variable | Descripción |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL base de la API. Debe empezar con `EXPO_PUBLIC_` para quedar disponible en el bundle |

## Comandos

### Desarrollo y build

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Levanta todas las apps en dev (Turborepo) |
| `pnpm build` | Build de frontend + backend |
| `pnpm start` | Arranca el backend en producción |
| `pnpm production` | Build + arranque de producción |
| `pnpm mobile` | Inicia la app móvil (Expo) |
| `pnpm mobile:web` / `mobile:android` / `mobile:ios` | Plataformas de Expo |

### Prisma (base de datos)

| Comando | Descripción |
|---------|-------------|
| `pnpm prisma:generate` | Genera el cliente Prisma |
| `pnpm prisma:push` | `prisma db push` |
| `pnpm prisma:migrate` | `prisma migrate deploy` (producción) |
| `pnpm prisma:migrate:dev` | `prisma migrate dev` (desarrollo) |
| `pnpm prisma:migrate:reset` | `prisma migrate reset` |
| `pnpm prisma:studio` | Abre Prisma Studio |
| `pnpm prisma:seed` | Seed de inicialización (un admin por módulo) |
| `pnpm prisma:seed:pm` | Seed del módulo Project Management |
| `pnpm prisma:seed:qc` | Seed del módulo Quality Control |
| `pnpm prisma:seed:demo` | Seed demo completo |
| `pnpm prisma:seed:prod` | Seed de producción |
| `pnpm prisma:migrate:pm` | Migración de datos legacy → PM |
| `pnpm prisma:drop:legacy` | Elimina tablas legacy |
| `pnpm prisma:sync:pm-names` | Sincroniza nombres de usuarios PM |
| `pnpm prisma:reset` | Reset + seed |

### Otros

| Comando | Descripción |
|---------|-------------|
| `pnpm test:pm` | Tests del módulo Project Management |
| `pnpm tunnel` | Túnel Cloudflare al backend local |

## Deploy (Railway)

El proyecto se despliega en **Railway** con un Dockerfile multi-stage:

1. **Build**: instala deps con pnpm y buildea frontend + backend (excluye la app móvil).
2. **Runtime**: Node 22 + Chromium (para export PDF de QC) y arranca el backend sirviendo el SPA.

### Flujo de deploy

- El backend sirve **todo**: API + SPA (landing y módulos) en un solo servicio.
- Las **migraciones** corren al arrancar (`prisma migrate deploy`).
- El **seed** corre solo si `SEED_ON_BOOT=true` (primera vez).
- Los **uploads** persisten en un volumen montado en `UPLOADS_DIR`.

### Dominios

| Dominio | Contenido |
|---------|-----------|
| `bdgestion.org` / `www.bdgestion.org` | Landing |
| `proyectos.bdgestion.org` | Módulo Project Management |
| `calidad.bdgestion.org` | Módulo Quality Control |

Los subdominios apuntan al mismo servicio; el SPA detecta el `hostname` y monta el módulo correspondiente (ver `apps/frontend/src/config/domains.ts`).

## Testing

- **Backend**: `tsx --test` (node:test) — `pnpm test:pm` corre los tests del módulo PM.
- **Frontend**: eslint (`pnpm lint`).
- **Type check**: `tsc --noEmit` (backend), `tsc -b` (frontend).

## Convenciones

- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:` con scope).
- **Base de datos**: tablas con prefijo por módulo (`erp_`, `pm_`, `qc_`, `executive_`).
- **Backend**: ES modules, ejecutado con `tsx` en runtime.
- **Git**: solo se commitea `pnpm-lock.yaml` (no `package-lock.json` ni `yarn.lock`).

---

## 👥 Colaboradores

Un agradecimiento especial a las personas que hacen posible este proyecto.

<div style="display: flex; gap: 10px; margin-top: 10px;">
  <a href="https://github.com/dimtha01" target="_blank">
    <img src="https://github.com/dimtha01.png" alt="dimtha01" width="50" height="50" style="border-radius: 50%;" />
  </a>
  <a href="https://github.com/Shino08" target="_blank">
    <img src="https://github.com/Shino08.png" alt="Shino08" width="50" height="50" style="border-radius: 50%;" />
  </a>
</div>

<br/>

<div align="center">
  <p><i>Desarrollado con ❤️ siguiendo los más altos estándares de calidad de software.</i></p>
</div>
