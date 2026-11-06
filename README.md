# Busca tu peli

Buscador de películas por plataforma de streaming (Netflix, Prime Video, Disney+, Max, Apple TV+).

```
api/        API REST · Express 5 + Mongoose (MongoDB)
frontend/   Web · HTML + CSS (SUIT, un archivo por página) + JavaScript, sin framework
legacy/     Versión original (HTML estático + peliculas.json), solo de referencia
```

## Arrancar en local

Requisitos: Node 18+ y MongoDB escuchando en `127.0.0.1:27017` (local o Docker:
`docker run -d --name buscatupeli-mongo -p 27017:27017 mongo:7`).

```bash
cd api
cp .env.example .env      # ajusta MONGO_URI si usas Atlas
npm install
npm run seed              # carga 25 películas y 3 noticias desde _data/
npm run dev               # http://localhost:3100
```

La API también sirve el front: abre **http://localhost:3100**. Si prefieres Live Server
sobre `frontend/`, el front apunta solo a `http://localhost:3100/buscatupeli`.

Estructura de la API (la misma organización que `pawcare_api`):

```
api/
  index.js          servidor Express: conexión a Mongo, middlewares y router en /buscatupeli
  middlewares.js    notFound, errorHandler, verificarToken (JWT) y límites de peticiones
  schemas.js        schemas de películas, noticias y recomendaciones
  models.js         modelos de Mongoose
  routes/router.js  rutas por recurso con .route()
  controllers/      login, peliculas, noticias, recomendaciones y tmdb
  services/         cliente de TMDB y generador de noticias
  scripts/          seed, importar, noticias y copiar-a-atlas (npm run …)
  functions/        funciones de Netlify: la API y las noticias semanales
  _data/            datos de ejemplo, peticiones .http y colección de Postman
```

## Importar películas desde TMDB

1. Pega tu token de TMDB ("Token de acceso de lectura a la API") en `api/.env` → `TMDB_TOKEN=...`
2. Importación masiva: `npm run importar` (las 30 más populares de cada plataforma en España;
   `npm run importar 50` para otra cantidad). Se puede repetir: no duplica y actualiza plataformas.
3. Películas sueltas: `admin.html` → **Importar desde TMDB** → buscar → **Añadir**.

## Publicación (buscatupeli.com · Netlify)

`netlify.toml` publica `frontend/` y ejecuta la API como función (`api/functions/api.js`),
accesible en la misma ruta `/buscatupeli`. Variables en Netlify → *Site configuration →
Environment variables*:

| Variable | Para qué |
|---|---|
| `MONGO_URI` | Conexión a MongoDB Atlas |
| `ADMIN_KEY` | Clave del panel admin, la que se escribe en su login (obligatoria en producción) |
| `JWT_SECRET` | Firma los tokens de sesión del panel (obligatoria en producción) |
| `TMDB_TOKEN` | Importar desde TMDB en el admin y generar las noticias |
| `BREVO_API_KEY` | Correos: suscripciones, sugerencias y newsletter (permisos All en Transactional email, Email campaigns y Contacts) |

Para subir los datos locales a Atlas: pon la cadena en `api/.env` → `MONGO_URI_ATLAS=...`
y ejecuta `npm run copiar-a-atlas`.

## Correos (Brevo, plan gratuito: 300 al día)

El dominio `buscatupeli.com` está autenticado en Brevo (DKIM y DMARC en el DNS de Netlify) y los correos
salen desde `info@buscatupeli.com`.

- **Newsletter**: el formulario del footer pide la suscripción con casilla de consentimiento y llega un
  correo para confirmarla (doble confirmación). Al confirmar, el email entra en la lista
  «Suscriptores Busca tu peli» de Brevo. Cada lunes la función `noticias-semanales` regenera las noticias
  y envía la newsletter (novedades del catálogo, populares de la semana y la mejor de cada plataforma).
  La baja la gestiona Brevo con el enlace de cada correo.
- **Sugerencias**: al enviar una, quien la sugiere recibe un agradecimiento con invitación a suscribirse
  (máximo uno al día por email) y a `info@buscatupeli.com` le llega el aviso; respondiendo, la respuesta
  va a quien la sugirió.
- Para ver la newsletter sin enviarla a nadie más: `npm run newsletter -- --prueba tu@correo.com`.

## Endpoints (`/buscatupeli`)

Lectura pública. Crear, editar, borrar, importar y leer recomendaciones exigen un token:
`POST /login` con `{ "clave": ADMIN_KEY }` devuelve un token JWT (8 h) que se manda en la cabecera
`Authorization: Bearer <token>`.

| Recurso | Método | Ruta |
|---|---|---|
| Login | POST | `/login` · GET `/admin/verificar` (comprueba el token) |
| Películas | GET | `/peliculas?q=&genero=&plataforma=&anio=&destacada=&orden=&limite=` |
| | GET | `/peliculas/genero/:genero` · `/peliculas/plataforma/:plataforma` |
| | GET | `/peliculas/generos` |
| | GET | `/peliculas/:_id` · `/peliculas/:_id/relacionadas` |
| | POST | `/peliculas` |
| | PUT / PATCH / DELETE | `/peliculas/:_id` |
| Noticias | GET / POST | `/noticias` |
| | GET / PUT / PATCH / DELETE | `/noticias/:_id` |
| TMDB | GET | `/tmdb/buscar?q=` |
| | POST | `/tmdb/importar/:tmdbId` |
| Suscripciones | POST | `/suscripciones` · GET `/suscripciones/confirmar/:token` (enlace del correo) |
| Recomendaciones | GET (`?estado=`) / POST | `/recomendaciones` |
| | GET / PATCH / DELETE | `/recomendaciones/:_id` |

Todas responden `{ message, data }`. Ejemplos en [api/_data/buscatupeli.http](api/_data/buscatupeli.http)
y en la colección de Postman [api/_data/buscatupeli.postman_collection.json](api/_data/buscatupeli.postman_collection.json).

## Páginas

- `index.html` – hero de destacadas, plataformas, filas por género y noticias
- `catalogo.html` – filtros por plataforma, género y orden (sincronizados con la URL)
- `pelicula.html?id=` – ficha completa pedida a la API al clicar un póster
- `noticias.html` – listado; al abrir una noticia se pide su cuerpo por id
- `recomendaciones.html` – formulario que guarda sugerencias (POST)
- `privacidad.html` – política de privacidad (newsletter y sugerencias)
- `admin.html` – CRUD de películas, noticias, sugerencias e importación TMDB (pide la clave de admin)
