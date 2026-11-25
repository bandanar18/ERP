# Business ERP - API Documentation

Documentación OpenAPI 3.0 organizada por feature con control de acceso basado en roles (RBAC).

## Estructura

```
docs/
├── openapi.yaml              # Archivo principal (info, servers, security schemes)
└── features/
    ├── auth.yaml             # Autenticación y gestión de sesiones
    ├── projects.yaml         # Gestión de proyectos (multi-tenant)
    ├── physical-progress.yaml # Avances físicos por proyecto
    └── security.yaml         # Seguridad y recuperación de cuenta
```

## Features Disponibles

### Autenticación (`auth.yaml`)

Gestión completa de identidades y sesiones:

| Endpoint | Método | Público | Descripción |
|----------|--------|---------|-------------|
| `/api/auth/register` | POST | ✓ | Registrar nuevo usuario |
| `/api/auth/login` | POST | ✓ | Iniciar sesión (con soporte OTP) |
| `/api/auth/logout` | POST | ✓ | Cerrar sesión |
| `/api/auth/refresh` | POST | ✓ | Refrescar token de acceso |
| `/api/auth/me` | GET | - | Obtener usuario actual |
| `/api/auth/init-roles` | POST | ✓ | Inicializar roles del sistema |
| `/api/auth/users/{id}/assign` | PUT | - | Asignar rol/empresa (solo admin) |
| `/api/auth/send-otp` | POST | ✓ | Enviar código OTP |
| `/api/auth/verify-otp` | POST | ✓ | Verificar código OTP |
| `/api/auth/request-password-reset` | POST | ✓ | Solicitar recuperación |
| `/api/auth/reset-password` | POST | ✓ | Restablecer contraseña |
| `/api/auth/change-password` | PUT | - | Cambiar contraseña |

**Flujos especiales:**
- Usuarios sin rol asignados reciben `requiresOtp: true`
- Usuarios con rol pero sin empresa reciben `pendingCompany: true`

### Proyectos (`projects.yaml`)

Gestión de proyectos con multi-tenancy y control por rol:

| Endpoint | Método | Planificador | Gestión | Admin | Descripción |
|----------|--------|--------------|---------|-------|-------------|
| `/api/projects` | GET | ✓ (sus proyectos) | ✓ | ✓ | Listar proyectos |
| `/api/projects/companies` | GET | ✓ (sus empresas) | ✓ | ✓ | Listar empresas |
| `/api/projects/company/:id` | GET | ✓ (sus proyectos) | ✓ | ✓ | Proyectos por empresa |
| `/api/projects/:id` | GET | ✓ (si es manager) | ✓ | ✓ | Detalle de proyecto |
| `/api/projects` | POST | - | ✓ | - | Crear proyecto |
| `/api/projects/:id` | PUT | - | ✓ | - | Actualizar proyecto |

**Comportamiento por rol:**
- **planificador**: Ve solo sus proyectos asignados (donde es managerId)
- **gestión**: Ve todos los proyectos de su empresa
- **administrador**: Ve todos los proyectos de todas las empresas

### Avances Físicos (`physical-progress.yaml`)

Seguimiento de avance físico de proyectos:

| Endpoint | Método | Planificador | Gestión | Admin | Descripción |
|----------|--------|--------------|---------|-------|-------------|
| `/api/physical-progress` | GET | ✓ (sus proyectos) | ✓ | ✓ | Avances por empresa |
| `/api/physical-progress/company/:id` | GET | ✓ (sus proyectos) | ✓ | ✓ | Avances por empresa |
| `/api/physical-progress/project/:id` | GET | ✓ (si es manager) | ✓ | ✓ | Historial completo |

**Datos incluidos:**
- Información del responsable (manager) de cada proyecto
- Lista de managers por empresa
- Último avance físico registrado
- Historial completo de avances (en endpoint de proyecto)

**Comportamiento por rol:**
- **planificador**: Solo sus proyectos asignados
- **gestión/administrador**: Todos los proyectos sin filtro

### Seguridad (`security.yaml`)

Operaciones de seguridad y recuperación de cuenta:

| Endpoint | Método | Público | Descripción |
|----------|--------|---------|-------------|
| `/api/auth/send-otp` | POST | ✓ | Enviar código OTP |
| `/api/auth/verify-otp` | POST | ✓ | Verificar código OTP |
| `/api/auth/request-password-reset` | POST | ✓ | Solicitar reset |
| `/api/auth/reset-password` | POST | ✓ | Restablecer contraseña |
| `/api/auth/change-password` | PUT | - | Cambiar contraseña |

## Roles del Sistema

| Rol | Permisos |
|-----|-----------|
| **planificador** | Ver sus proyectos asignados, registrar avances físicos |
| **gestión** | Ver proyectos de su empresa, crear/editar proyectos |
| **administrador** | Acceso total, asignar roles, ver todas las empresas |
| **contador** | Próximamente... |
| **ventas** | Próximamente... |
| **operacion** | Próximamente... |
| **cliente** | Próximamente... |
| **colaborador** | Próximamente... |

## Multi-Tenancy

El sistema soporta multi-tenancy a nivel de empresa:

- Los usuarios con `companyId` asociado solo ven datos de su empresa
- Los roles de gestión y administrador pueden tener `companyId: null` para acceso global
- Los planificadores siempre están vinculados a una empresa específica

## Ver Documentación

- **UI Interactiva (Swagger UI)**: http://localhost:3001/api-docs
- **YAML Combinado**: http://localhost:3001/api-docs/swagger.yaml
- **JSON Espec**: http://localhost:3001/api-docs/swagger.json

## Cómo Agregar un Nuevo Feature

1. Crear `docs/features/[nombre].yaml`
2. Definir `tags` para agrupar endpoints
3. Definir `paths` con los endpoints
4. Definir `components.schemas` con los modelos
5. Definir `components.responses` para respuestas reutilizables
6. Reiniciar el servidor (se combina automáticamente en `swagger.ts`)

## Notas

- Los archivos de features se combinan automáticamente al iniciar el servidor
- No es necesario hacer build para ver cambios en la documentación
- Los tokens JWT son stateless (logout elimina tokens del cliente)
- Rate limiting aplicado en endpoints públicos para prevenir abuso
