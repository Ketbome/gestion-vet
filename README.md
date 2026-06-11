# 🐾 GestionVet

**Sistema de gestión para veterinarias: simple, fácil de entender y pensado para el día a día.**

Lleva el control de tu clínica sin planillas ni sistemas complicados: atenciones, inventario, pedidos a proveedores, gastos y ganancias — todo en una sola app que funciona igual de bien en el celular que en el computador.

> La idea es partir simple. Si te gusta y te sirve, puede ir evolucionando 🚀

## ✨ Qué hace

- **📊 Dashboard** — Ingresos, gastos y ganancia de un vistazo, con filtros por día, semana, mes, año o rango personalizado. Servicios y productos más vendidos, atenciones recientes y alertas de stock bajo.
- **🩺 Atenciones** — Registra cada visita en segundos: mascota, dueño, servicios del catálogo y productos vendidos (con autocompletado). El stock se descuenta solo.
- **📦 Inventario** — Productos con stock, precios de costo/venta y alertas de stock mínimo. Incluye un catálogo de ~60 productos veterinarios típicos para que el autocompletado funcione desde el día uno; en el inventario solo aparecen "en uso" los que realmente has usado.
- **🚚 Pedidos** — Flujo completo: *pedido → comprado → recibido*. Al recibir, el stock se suma al inventario y el gasto queda registrado automáticamente.
- **💸 Gastos** — Arriendo, sueldos, insumos... más los gastos automáticos de los pedidos.
- **📈 Reportes** — Ingresos vs gastos mes a mes, con la ganancia de cada período.
- **🔒 Login con JWT** — Credenciales y duración de sesión configurables por variables de entorno.
- **🌎 Moneda configurable en runtime** — CLP por defecto; cambia `CURRENCY_LOCALE`/`CURRENCY` y toda la app se adapta sin rebuildear.

## 🧰 Tecnologías

Next.js 16 · React 19 · Tailwind CSS 4 · SQLite (better-sqlite3 + Drizzle ORM) · SweetAlert2

Sin servicios externos: la base de datos es un archivo SQLite que se crea y se siembra sola en el primer arranque.

## 🚀 Empezar (desarrollo)

```bash
git clone <este-repo>
cd gestion-vet
npm install
cp .env.example .env.local   # edita credenciales y secreto
npm run dev
```

Abre http://localhost:3000 e inicia sesión con las credenciales de tu `.env.local`.

## 🐳 Desplegar con Docker

Todas las variables se leen **en runtime**: la misma imagen sirve para cualquier configuración, y cambiar un valor solo requiere reiniciar el contenedor (no rebuildear).

1. Crea un archivo `.env` junto al `docker-compose.yml`:

```env
AUTH_USER=admin
AUTH_PASSWORD=una-contraseña-segura
JWT_SECRET=64-caracteres-hex-aleatorios   # genera uno: openssl rand -hex 32
AUTH_SESSION_DAYS=30
CURRENCY_LOCALE=es-CL
CURRENCY=CLP
PORT=3000
```

2. Levanta el servicio:

```bash
docker compose up -d --build
```

La base de datos queda en el volumen `gestionvet-data`, así que sobrevive actualizaciones de la imagen. Para actualizar: `git pull && docker compose up -d --build`.

## ⚙️ Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `AUTH_USER` | Usuario de acceso | `admin` |
| `AUTH_PASSWORD` | Contraseña de acceso | — (obligatoria) |
| `JWT_SECRET` | Secreto para firmar la sesión | — (obligatoria) |
| `AUTH_SESSION_DAYS` | Días que dura la sesión | `30` |
| `CURRENCY_LOCALE` | Locale para formatear montos | `es-CL` |
| `CURRENCY` | Código de moneda ISO 4217 | `CLP` |
| `DATABASE_PATH` | Ruta del archivo SQLite | `./data/gestionvet.db` |

## 🗺️ Hacia dónde puede evolucionar

Algunas ideas si el proyecto gusta: fichas de clientes y mascotas con historial, agenda de citas y recordatorios de vacunas, múltiples usuarios con roles, exportar reportes, respaldos automáticos…

¿Sugerencias o problemas? ¡Abre un issue!

## ☕ Apoya el proyecto

Si GestionVet te sirve, puedes invitarme un café:

<a href="https://buymeacoffee.com/pims2711y" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="150" height="40">
  </a>
