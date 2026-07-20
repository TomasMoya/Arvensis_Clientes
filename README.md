# Sistema de Gestión de Clientes

**Gestión profesional de clientes, trazabilidad y tareas en un solo lugar.**

[![Java](https://img.shields.io/badge/Java-21-blue?style=flat-square)](https://www.java.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-brightgreen?style=flat-square)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=flat-square)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## ¿Qué es esta app?

Es una aplicación web full-stack diseñada para gestionar clientes (profesionales), hacer seguimiento comercial mediante trazabilidad, organizar tareas individuales y grupales, y visualizar todo en un calendario integrado.

Desarrollada con **Spring Boot + Vanilla JS**, orientada a equipos pequeños con necesidades de gestión interna.

---

## Capturas de pantalla
<img width="100%" height="600px" alt="Screenshot 2026-05-29 084226" src="https://github.com/user-attachments/assets/e5a37722-a2c3-42e9-a278-2ec7a3acbb75" />
<img width="100%" height="600px" alt="Screenshot 2026-07-20 194652" src="https://github.com/user-attachments/assets/16f4c1d0-92fa-482a-afb0-0963458a5f67" />
<img width="100%" height="600px" alt="Screenshot 2026-07-20 194305" src="https://github.com/user-attachments/assets/6ed0d9c3-bde8-45c9-9399-46391065408f" />
<img width="100%" height="600px" alt="Screenshot 2026-07-20 194320" src="https://github.com/user-attachments/assets/67dddd6c-c14b-43c7-9fa4-c623248683f0" />
<img width="100%" height="600px" alt="Screenshot 2026-07-20 194341" src="https://github.com/user-attachments/assets/56083f0a-5d54-416e-8e5f-2e113d729650" />
<img width="100%" height="600px" alt="Screenshot 2026-07-20 194357" src="https://github.com/user-attachments/assets/20d36d1e-bfcf-478b-92dc-5a8ede5250ce" />

---

## Stack tecnológico

### Backend
| Tecnología | Uso |
|---|---|
| Java 21 | Lenguaje principal |
| Spring Boot 4 | Framework web y seguridad |
| Spring Security + JWT | Autenticación y autorización por roles |
| JPA / Hibernate | ORM y acceso a datos |
| Flyway | Migraciones de base de datos |
| MySQL 8 | Base de datos relacional |
| Apache POI | Importación y exportación de Excel |

### Frontend
| Tecnología | Uso |
|---|---|
| HTML / CSS / JavaScript | Vanilla, sin frameworks |
| DM Sans + DM Mono | Tipografía |
| Drag & Drop API | Tablero Kanban |

### Infraestructura
| Tecnología | Uso |
|---|---|
| Docker + Docker Compose | Contenedorización |
| nginx | Servidor web y proxy reverso |
| DonWeb VPS | Hosting en producción |
| SSL (Sectigo) | HTTPS con certificado propio |

---

## Funcionalidades

### 👥 Gestión de clientes
- Alta, baja y modificación de profesionales
- Paginación, búsqueda en toda la base de datos y filtros por profesión y personal asignado
- Importación masiva desde Excel (.xlsx)
- Exportación a Excel con datos de trazabilidad incluidos
- Asignación de personal responsable por cliente
- Acceso a Google Maps desde la dirección del cliente
- Indicador visual de estado de contacto

### 📊 Trazabilidad
- Registro de acciones comerciales por cliente: contacto, catálogo, visita y compra
- Comentarios por acción y fecha de primer contacto
- Seguimiento de tráfico (orgánico / pago)
- Alerta automática de clientes contactados hace más de 15 días que aún siguen sin comprar

### ✅ Tareas individuales
- Tablero Kanban con drag & drop (Pendiente → Procesando → Finalizada)
- Objetivos mensuales y trimestrales con seguimiento tipo checklist
- Campos: título, descripción, fecha límite, prioridad y tipo
- Botones de mover entre columnas para mobile

### 👨‍👩‍👧‍👦 Grupos de tareas
- Creación de grupos compartidos entre usuarios
- Gestión de miembros: agregar y quitar
- Asignación de tareas a miembros del grupo
- Las tareas asignadas aparecen automáticamente en las tareas individuales del usuario

### 📅 Calendario
- Vista de 30 días con tareas propias y grupales
- Colores por tipo: tarea, objetivo mensual, objetivo trimestral
- Objetivos sin fecha límite se posicionan al fin de mes o trimestre automáticamente
- Click en tarea abre el modal de edición directamente

### 🔐 Usuarios y seguridad
- Login con JWT y roles ADMIN / USER
- Panel de administración de usuarios (solo ADMIN)
- CORS restringido al dominio de producción
- Contraseñas hasheadas con BCrypt

---

## Arquitectura

```
┌─────────────────────────────────────────────┐
│                  nginx                      │
│         (puerto 80 → HTTPS 443)             │
│    proxy_pass /api/ → backend:8080          │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │   Spring Boot API   │
    │     puerto 8080     │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │      MySQL 8        │
    │   Flyway V1→V17     │
    └─────────────────────┘
```

Todo corre en Docker Compose en un VPS de DonWeb con dominio y SSL propios.

---

## Instalación local

### Requisitos
- Docker Desktop
- Java 21 (solo si querés correr el backend sin Docker)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TomasMoya/Arvensis_Clientes.git
cd Arvensis_Clientes
```

### 2. Crear el archivo `.env`

```env
DB_ROOT_PASSWORD="tu_contraseña_root"
DB_NAME=arvensis_profesionales
DB_USERNAME=arvensis_user
DB_PASSWORD="tu_contraseña"
JWT_SECRET="tu_clave_secreta_larga"
```

### 3. Levantar con Docker

```bash
docker-compose up --build
```

La app estará disponible en `http://localhost`.

### 4. Crear el usuario admin inicial

```bash
docker exec -it arvensis-db mysql -u arvensis_user -p
```

```sql
USE arvensis_profesionales;
INSERT INTO usuarios (nombre, login, clave, rol)
VALUES ('Admin', 'tu_usuario', '$2a$10$hashBCrypt', 'ADMIN');
```

> Generá el hash BCrypt con la clase `GenerarHash` en IntelliJ usando `BCryptPasswordEncoder`.

---

## Estructura del proyecto

```
Arvensis_Clientes/
├── backend/                   # Spring Boot
│   ├── src/
│   │   └── main/java/com/arvensis/profesionales/
│   │       ├── profesional/   # CRUD clientes, importación, exportación
│   │       ├── trazabilidad/  # Seguimiento comercial
│   │       ├── Usuario/       # Auth, roles, tareas, grupos, calendario
│   │       └── infra/         # Security, CORS, JWT
│   ├── resources/db/migration/ # Migraciones Flyway V1→V17
│   └── Dockerfile
├── frontend/                  # HTML + CSS + JS vanilla
│   ├── index/                 # Lista de clientes
│   ├── login/
│   ├── sin-compra/
│   ├── trazabilidad/
│   ├── usuarios/
│   ├── tareas/
│   └── calendario/
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env                       # No incluido en el repo
```

---

## Deploy en producción

El deploy se realiza en un VPS de **DonWeb** con Docker Compose. El flujo estándar es:

```bash
# En el servidor (Putty / SSH)
cd /root/DeployDonWeb/Arvensis_Clientes
git pull
docker-compose down
docker-compose up -d --build
```

El certificado SSL (Sectigo Positive) se monta como volumen en nginx:

```yaml
volumes:
  - /root/ssl:/etc/ssl/arvensis
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DB_ROOT_PASSWORD` | Contraseña del usuario root de MySQL |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USERNAME` | Usuario de la app en MySQL |
| `DB_PASSWORD` | Contraseña del usuario de la app |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |

---

## Migraciones Flyway

| Versión | Descripción |
|---|---|
| V1 | Creación tabla profesionales |
| V2 | Constraint unique email |
| V3-V9 | Modificaciones y nuevos campos en profesionales |
| V10 | Tabla usuarios |
| V11 | Campo rol en usuarios |
| V12-V13 | Nuevas profesiones y campos nullable |
| V14 | Tabla tareas |
| V15 | Prioridad nullable |
| V16 | Campo tipo en tareas |
| V17 | Tabla grupos_tareas y grupos_usuarios |

---

## Autor

**Tomás Moya**
Desarrollado como proyecto full-stack de uso real en producción.

🌐 [linkedin.com/in/tomas--moya/](https://www.linkedin.com/in/tomas--moya/)
🐙 [github.com/TomasMoya](https://github.com/TomasMoya)
