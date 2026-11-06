/* Cliente de TMDB (themoviedb.org) y conversión de sus datos a nuestro esquema de película.
   La disponibilidad en plataformas ("watch providers") la proporciona JustWatch a través de TMDB */
const { Pelicula } = require('../models')

const API = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'
const REGION = 'ES'
const IDIOMA = 'es-ES'

/* Cómo reconocemos cada plataforma por el nombre que devuelve TMDB (sin variantes "with Ads" ni canales) */
const PLATAFORMAS = {
    netflix: { patron: /^netflix$/i, url: 'https://www.netflix.com' },
    prime: { patron: /^amazon prime video$/i, url: 'https://www.primevideo.com' },
    disney: { patron: /^disney\s*(\+|plus)$/i, url: 'https://www.disneyplus.com' },
    max: { patron: /^(hbo )?max$/i, url: 'https://www.max.com' },
    /* En ES se llama "Apple TV" (id 350); "Apple TV Store" es alquiler/compra y no cuenta */
    appletv: { patron: /^apple tv(\s*(\+|plus))?$/i, url: 'https://tv.apple.com' }
}

const errorConStatus = (mensaje, status) => Object.assign(new Error(mensaje), { status })

const tmdb = async (ruta, query = {}) => {
    const token = process.env.TMDB_TOKEN
    if (!token) throw errorConStatus('Falta TMDB_TOKEN en el archivo .env de la API', 503)

    const url = new URL(API + ruta)
    Object.entries(query).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v))

    let res
    try {
        res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, accept: 'application/json' } })
    } catch {
        throw errorConStatus('No se pudo conectar con TMDB', 502)
    }
    if (res.status === 401) throw errorConStatus('TMDB rechaza el token: revisa TMDB_TOKEN en .env', 502)
    if (res.status === 404) throw errorConStatus('Esa película no existe en TMDB', 404)
    if (!res.ok) throw errorConStatus(`TMDB respondió con error ${res.status}`, 502)
    return res.json()
}

/* Ids de proveedor de TMDB para nuestras claves, leídos de su API (se cachean en memoria) */
let proveedoresCache = null
const proveedores = async () => {
    if (proveedoresCache) return proveedoresCache
    const { results } = await tmdb('/watch/providers/movie', { language: IDIOMA, watch_region: REGION })
    const mapa = {}
    for (const [clave, { patron }] of Object.entries(PLATAFORMAS)) {
        const p = results.find((r) => patron.test(r.provider_name.trim()))
        if (p) mapa[clave] = p.provider_id
    }
    proveedoresCache = mapa
    return mapa
}

const claveDeProveedor = (mapa, providerId) => Object.keys(mapa).find((k) => mapa[k] === providerId)

const nombrePais = new Intl.DisplayNames(['es'], { type: 'region' })

/* Elige el tráiler: oficial y de YouTube, primero en español */
const elegirTrailer = (videos = []) => {
    const yt = videos.filter((v) => v.site === 'YouTube' && ['Trailer', 'Teaser'].includes(v.type))
    const orden = (v) => (v.iso_639_1 === 'es' ? 0 : 2) + (v.type === 'Trailer' ? 0 : 1) - (v.official ? 0.5 : 0)
    const v = yt.sort((a, b) => orden(a) - orden(b))[0]
    return v ? `https://www.youtube.com/embed/${v.key}` : ''
}

/* Fondo apaisado sin texto (el carrusel pone su propio título encima): el más votado y, a igualdad, el más grande */
const elegirFondo = (d) => {
    const sinTexto = (d.images?.backdrops || []).filter((b) => !b.iso_639_1)
    const mejor = sinTexto.sort((a, b) => b.vote_average - a.vote_average || b.width - a.width)[0]
    const ruta = mejor?.file_path || d.backdrop_path
    return ruta ? `${IMG}/w1280${ruta}` : ''
}

/* Ficha completa de TMDB convertida a nuestro esquema */
const obtenerPelicula = async (tmdbId) => {
    const mapa = await proveedores()
    const d = await tmdb(`/movie/${tmdbId}`, {
        language: IDIOMA,
        append_to_response: 'credits,videos,watch/providers,images',
        include_video_language: 'es,en',
        include_image_language: 'null'
    })

    let sinopsis = d.overview
    if (!sinopsis) sinopsis = (await tmdb(`/movie/${tmdbId}`, { language: 'en-US' })).overview || 'Sin sinopsis disponible.'

    const crew = d.credits?.crew || []
    const nombres = (filtro) => [...new Set(crew.filter(filtro).map((c) => c.name))]
    const disponibles = d['watch/providers']?.results?.[REGION]?.flatrate || []

    return {
        tmdbId: d.id,
        titulo: d.title,
        tituloOriginal: d.original_title,
        sinopsis,
        poster: d.poster_path ? `${IMG}/w500${d.poster_path}` : '',
        backdrop: elegirFondo(d),
        trailer: elegirTrailer(d.videos?.results),
        anio: d.release_date ? Number(d.release_date.slice(0, 4)) : undefined,
        duracionMin: d.runtime || undefined,
        pais: d.production_countries?.[0] ? nombrePais.of(d.production_countries[0].iso_3166_1) : '',
        direccion: nombres((c) => c.job === 'Director'),
        guion: nombres((c) => ['Screenplay', 'Writer'].includes(c.job)).slice(0, 4),
        reparto: (d.credits?.cast || []).slice(0, 6).map((c) => c.name),
        companias: (d.production_companies || []).slice(0, 4).map((c) => c.name),
        /* TMDB dice "Bélica"; el catálogo usa "Guerra" */
        generos: [...new Set((d.genres || []).map((g) => (g.name === 'Bélica' ? 'Guerra' : g.name)))],
        plataformas: [...new Set(disponibles.map((p) => claveDeProveedor(mapa, p.provider_id)).filter(Boolean))]
            .map((clave) => ({ clave, url: PLATAFORMAS[clave].url })),
        destacada: false
    }
}

/* Ids de las películas más populares de una plataforma en España */
const descubrir = async (clave, cantidad = 30) => {
    const mapa = await proveedores()
    if (!mapa[clave]) throw errorConStatus(`TMDB no tiene la plataforma ${clave} en ${REGION}`, 404)

    const ids = []
    for (let page = 1; ids.length < cantidad; page++) {
        const r = await tmdb('/discover/movie', {
            language: IDIOMA,
            watch_region: REGION,
            with_watch_providers: mapa[clave],
            with_watch_monetization_types: 'flatrate',
            sort_by: 'popularity.desc',
            page
        })
        ids.push(...r.results.map((m) => m.id))
        if (page >= r.total_pages) break
    }
    return ids.slice(0, cantidad)
}

const buscar = async (q) => {
    const r = await tmdb('/search/movie', { query: q, language: IDIOMA, region: REGION, include_adult: false })
    return r.results.slice(0, 12).map((m) => ({
        tmdbId: m.id,
        titulo: m.title,
        tituloOriginal: m.original_title,
        anio: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
        poster: m.poster_path ? `${IMG}/w185${m.poster_path}` : ''
    }))
}

/* ¿Ya está en el catálogo? Por tmdbId o, para las del seed, por título original + año */
const existente = (p) => Pelicula.findOne({
    $or: [
        { tmdbId: p.tmdbId },
        ...(p.tituloOriginal && p.anio ? [{ tituloOriginal: p.tituloOriginal, anio: p.anio }] : [])
    ]
})

module.exports = {
    obtenerPelicula,
    descubrir,
    buscar,
    existente
}
