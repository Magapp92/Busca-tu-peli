/* Cliente único de la API. La API responde siempre { message, data }:
   devolvemos data si va bien y lanzamos un Error con message si no */

/* Si la web la sirve la propia API (puerto 3100) usamos ruta relativa;
   con Live Server u otro puerto apuntamos a localhost:3100 */
const BASE_URL = window.BUSCATUPELI_API
    || (location.port === '3100' ? '/buscatupeli' : 'http://localhost:3100/buscatupeli')

export const apiFetch = async (path, { method = 'GET', body, query } = {}) => {
    const url = new URL(BASE_URL + path, location.origin)
    if (query) {
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
        })
    }

    let res
    try {
        res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        })
    } catch {
        throw new Error('No se pudo conectar con el servidor. ¿Está la API arrancada?')
    }

    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
        const error = new Error(payload.message || `Error ${res.status}`)
        error.status = res.status
        throw error
    }

    return payload.data
}

/* Atajos por recurso para que las páginas lean como frases */
export const api = {
    peliculas: {
        listar: (query) => apiFetch('/peliculas', { query }),
        generos: () => apiFetch('/peliculas/generos'),
        obtener: (id) => apiFetch(`/peliculas/${id}`),
        relacionadas: (id) => apiFetch(`/peliculas/${id}/relacionadas`),
        crear: (body) => apiFetch('/peliculas', { method: 'POST', body }),
        reemplazar: (id, body) => apiFetch(`/peliculas/${id}`, { method: 'PUT', body }),
        modificar: (id, body) => apiFetch(`/peliculas/${id}`, { method: 'PATCH', body }),
        borrar: (id) => apiFetch(`/peliculas/${id}`, { method: 'DELETE' })
    },
    noticias: {
        listar: (query) => apiFetch('/noticias', { query }),
        obtener: (id) => apiFetch(`/noticias/${id}`),
        crear: (body) => apiFetch('/noticias', { method: 'POST', body }),
        reemplazar: (id, body) => apiFetch(`/noticias/${id}`, { method: 'PUT', body }),
        borrar: (id) => apiFetch(`/noticias/${id}`, { method: 'DELETE' })
    },
    tmdb: {
        buscar: (q) => apiFetch('/tmdb/buscar', { query: { q } }),
        importar: (tmdbId) => apiFetch(`/tmdb/importar/${tmdbId}`, { method: 'POST' })
    },
    recomendaciones: {
        listar: (query) => apiFetch('/recomendaciones', { query }),
        crear: (body) => apiFetch('/recomendaciones', { method: 'POST', body }),
        modificar: (id, body) => apiFetch(`/recomendaciones/${id}`, { method: 'PATCH', body }),
        borrar: (id) => apiFetch(`/recomendaciones/${id}`, { method: 'DELETE' })
    }
}
