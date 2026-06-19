# 🐾 GestionVet

**Sistema de gestión para veterinarias: simple, fácil de entender y pensado para el día a día.**

Lleva el control de tu clínica sin planillas ni sistemas complicados: atenciones, inventario, pedidos a proveedores, gastos y ganancias — todo en una sola app que funciona igual de bien en el celular que en el computador. Y cuando lo necesites, activa el **modo completo** con fichas de clientes y mascotas, historial clínico, agenda y recordatorios.

> Empieza simple y crece cuando quieras: dos modos en la misma app 🚀

## 🔀 Dos modos en una

Desde **Configuración** eliges cómo opera la app (cambias cuando quieras, sin perder datos):

- **Básico** — Atención rápida con nombre de mascota y dueño como texto libre. Ideal para domicilio o para partir sin complicaciones. *Es como funcionaba siempre.*
- **Completo** — Suma fichas de tutores y mascotas, historial clínico, control de peso con gráfico, recordatorios de vacunas/antiparasitarios y de próximas visitas, hospitalización, buscador global, agenda con calendario, multiusuario por roles, recetas/certificados imprimibles, pagos y deuda, y una página pública para que los clientes pidan hora.

## ✨ Qué hace

- **📊 Dashboard** — Ingresos, gastos y ganancia de un vistazo, con filtros por día, semana, mes, año o rango personalizado y un **gráfico de tendencia de ingresos**. Servicios y productos más vendidos, atenciones recientes y alertas de stock bajo. En modo completo: **recordatorios** (próximos controles, vacunas por vencer, mascotas inactivas), **confirmaciones de citas de mañana** y **pacientes hospitalizados**.
- **🔎 Buscador global** *(modo completo)* — Una barra en el header para encontrar al instante cualquier cliente (por nombre, RUT, teléfono o email) o mascota (por nombre o microchip) y saltar a su ficha.
- **🩺 Atenciones** — Registra cada visita en segundos: servicios del catálogo y productos vendidos (con autocompletado), el stock se descuenta solo. En modo completo enlazas la atención a la ficha de la mascota (con peso y temperatura), queda en su historial clínico y puedes dejar agendado el **próximo control**.
- **🧑‍🤝‍🧑 Clientes y mascotas** *(modo completo)* — Fichas de tutores (teléfono, email, RUT, dirección) y mascotas (especie, raza, color, sexo, edad, peso, microchip, esterilización, alergias). Cada mascota tiene su historial clínico, **gráfico de evolución de peso**, registro de vacunas/antiparasitarios y su próxima visita.
- **🩻 Ficha clínica y recetas** *(modo completo)* — Anamnesis, examen físico, signos (peso, temperatura, FC, FR, mucosas), diagnóstico y tratamiento. Emite **recetas** y descarga **recetas, carnet de vacunas y certificados de salud** como **PDF** generado en el servidor (con el logo y los datos de tu clínica).
- **🏥 Hospitalización** *(modo completo)* — Ingreso de pacientes con evolución diaria (signos vitales y tratamiento, con **gráfico** de temperatura y peso), cargos por productos e insumos (descuenta stock) o cargos manuales, cobro con estado de pago, y alta. Cada hospitalización queda enlazada a la ficha de la mascota.
- **🔔 Recordatorios** *(modo completo)* — Agenda la **próxima visita** de cada mascota (al cerrar la atención o desde su ficha) y revisa en un solo lugar los próximos controles, las **vacunas/antiparasitarios por vencer** y las **mascotas que no vienen hace más de un año** para hacer seguimiento.
- **👥 Multiusuario y roles** *(modo completo)* — Admin, veterinario y recepción. Cada veterinario tiene su **agenda propia** y sus consultas. El admin gestiona el equipo desde **Usuarios**.
- **📅 Agenda por cupos** *(modo completo)* — Calendario de citas filtrable por veterinario; cada vet define su **horario semanal** y la agenda (y el agendamiento público) muestran solo los **cupos libres**. Convierte una cita en atención con un clic.
- **💳 Pagos y deuda** *(modo completo)* — Registra pagos por atención (efectivo, débito, crédito, transferencia), con estado Pagado/Parcial/Pendiente, saldo por cliente y total **Por cobrar** en el dashboard.
- **🌐 Agendamiento público** *(modo completo)* — Página `/agendar` sin login para que los clientes soliciten hora dejando email y/o teléfono (obligatorio). Las solicitudes llegan a la agenda para confirmarlas.
- **📦 Inventario** — Productos con stock, precios de costo/venta y alertas de stock mínimo. Incluye un catálogo de ~60 productos veterinarios típicos para que el autocompletado funcione desde el día uno; en el inventario solo aparecen "en uso" los que realmente has usado.
- **🚚 Pedidos** — Flujo completo: *pedido → comprado → recibido*. Al recibir, el stock se suma al inventario y el gasto queda registrado automáticamente.
- **💸 Gastos** — Arriendo, sueldos, insumos... más los gastos automáticos de los pedidos.
- **📈 Reportes** — Gráficos de **ingresos vs gastos** mes a mes (barras + línea de ganancia) y desglose en torta por **método de pago** y por **categoría de gasto**.
- **🔒 Login con JWT** — Credenciales y duración de sesión configurables por variables de entorno.
- **🌎 Moneda configurable en runtime** — CLP por defecto; cambia `CURRENCY_LOCALE`/`CURRENCY` y toda la app se adapta sin rebuildear.
- **📱 PWA** — Instalable en el celular y con navegación pensada para móvil.

## 🧰 Tecnologías

Next.js 16 · React 19 · Tailwind CSS 4 · SQLite (better-sqlite3 + Drizzle ORM) · Recharts (gráficos) · SweetAlert2 · pdf-lib (PDFs)

Sin servicios externos: la base de datos es un archivo SQLite que se crea y se siembra sola en el primer arranque.

## 🚀 Empezar (desarrollo)

```bash
git clone <este-repo>
cd gestion-vet
npm install
cp .env.example .env.local   # edita credenciales y secreto
npm run dev
```

Abre http://localhost:3000. En el **primer arranque** se crea un usuario administrador a partir de `AUTH_USER`/`AUTH_PASSWORD` de tu `.env.local`. Desde **Usuarios** (como admin) puedes crear veterinarios y recepción.

### 🧪 Datos de demostración (opcional)

Para probar el **modo completo** con datos de ejemplo (clientes, mascotas, vacunas, atenciones, citas y un veterinario con horario), con el servidor detenido ejecuta:

```bash
node scripts/seed-demo.mjs
```

Activa el modo completo y carga datos ficticios, incluido un veterinario de prueba (**usuario `drarojas` / clave `vet123`**). Es idempotente: no duplica lo ya existente.

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
| `AUTH_USER` | Usuario admin inicial (bootstrap del primer arranque) | `admin` |
| `AUTH_PASSWORD` | Contraseña del admin inicial | — (obligatoria) |
| `JWT_SECRET` | Secreto para firmar la sesión | — (obligatoria) |
| `AUTH_SESSION_DAYS` | Días que dura la sesión | `30` |
| `CURRENCY_LOCALE` | Locale para formatear montos | `es-CL` |
| `CURRENCY` | Código de moneda ISO 4217 | `CLP` |
| `DATABASE_PATH` | Ruta del archivo SQLite | `./data/gestionvet.db` |

## 🗺️ Hacia dónde puede evolucionar

Ya implementado: fichas de clientes y mascotas con historial, ficha clínica, recetas/carnet/certificados imprimibles, multiusuario con roles y agenda por veterinario con cupos, pagos y deuda, hospitalización, recordatorios de vacunas y de próximas visitas con recall de inactivos, buscador global, reportes con gráficos y agendamiento público. Próximas ideas: envío real de recordatorios por email/WhatsApp, adjuntar fotos/exámenes de laboratorio, boleta/factura electrónica (SII), exportar reportes y respaldos automáticos.

¿Sugerencias o problemas? ¡Abre un issue!

## ☕ Apoya el proyecto

Si GestionVet te sirve, puedes invitarme un café:

<a href="https://buymeacoffee.com/pims2711y" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="150" height="40">
  </a>
