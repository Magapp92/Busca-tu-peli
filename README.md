# Busca tu peli

Buscador de películas por plataforma de streaming (Netflix, Prime Video, Disney+, Max, Apple TV+).

```
api/        API REST · Express 5 + Mongoose (MongoDB)
frontend/   Web · HTML + CSS + JavaScript (módulos ES), sin framework
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

## Importar películas desde TMDB

1. Pega tu token de TMDB ("Token de acceso de lectura a la API") en `api/.env` → `TMDB_TOKEN=...`
2. Importación masiva: `npm run importar` (las 30 más populares de cada plataforma en España;
   `npm run importar 50` para otra cantidad). Se puede repetir: no duplica y actualiza plataformas.
3. Películas sueltas: `admin.html` → **Importar desde TMDB** → buscar → **Añadir**.

## Endpoints (`/buscatupeli`)

| Recurso | Método | Ruta |
|---|---|---|
| Películas | GET | `/peliculas?q=&genero=&plataforma=&anio=&destacada=&orden=&limite=` |
| | GET | `/peliculas/generos` |
| | GET | `/peliculas/:_id` · `/peliculas/:_id/relacionadas` |
| | POST | `/peliculas` |
| | PUT / PATCH / DELETE | `/peliculas/:_id` |
| Noticias | GET / POST | `/noticias` |
| | GET / PUT / PATCH / DELETE | `/noticias/:_id` |
| TMDB | GET | `/tmdb/buscar?q=` |
| | POST | `/tmdb/importar/:tmdbId` |
| Recomendaciones | GET (`?estado=`) / POST | `/recomendaciones` |
| | GET / PATCH / DELETE | `/recomendaciones/:_id` |

Todas responden `{ message, data }`. Ejemplos en [api/_data/buscatupeli.http](api/_data/buscatupeli.http).

## Páginas

- `index.html` – hero de destacadas, plataformas, filas por género y noticias
- `catalogo.html` – filtros por plataforma, género y orden (sincronizados con la URL)
- `pelicula.html?id=` – ficha completa pedida a la API al clicar un póster
- `noticias.html` – listado; al abrir una noticia se pide su cuerpo por id
- `recomendaciones.html` – formulario que guarda sugerencias (POST)
- `admin.html` – CRUD de películas, noticias y gestión de sugerencias

> El panel de administración no tiene login: es un MVP para uso local.
