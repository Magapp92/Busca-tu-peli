/* Cliente único de la API. La API responde siempre { message, data }:
   devolvemos data si va bien y lanzamos un Error con message si no */

/* La API vive en el mismo dominio (/buscatupeli): en local la sirve Express y en
   buscatupeli.com la función de Netlify. Solo con Live Server u otro servidor de
   desarrollo apuntamos a localhost:3100 */
const SERVIDOR_DEV = location.protocol === 'file:' || ['5500', '5501', '5173', '8080'].includes(location.port)
const BASE_URL = window.BUSCATUPELI_API || (SERVIDOR_DEV ? 'http://localhost:3100/buscatupeli' : '/buscatupeli')

/* Clave del panel admin: se guarda solo durante la sesión del navegador */
const CLAVE_ADMIN = 'buscatupeli-admin'

const claveAdmin = {
    leer: () => { try { return sessionStorage.getItem(CLAVE_ADMIN) || '' } catch { return '' } },
    guardar: (valor) => { try { sessionStorage.setItem(CLAVE_ADMIN, valor) } catch { /* sin almacenamiento */ } },
    borrar: () => { try { sessionStorage.removeItem(CLAVE_ADMIN) } catch { /* sin almacenamiento */ } }
}

/* Hace la petición y devuelve una promesa con data; si la API responde error, la promesa se rechaza con su message */
const apiFetch = (path, { method = 'GET', body, query, admin = false, clave } = {}) => {
    const url = new URL(BASE_URL + path, location.origin)
    if (query) {
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
        })
    }

    /* La clave de admin solo viaja en las peticiones de administración, nunca en las públicas */
    const headers = { 'Content-Type': 'application/json' }
    const claveEnviada = admin ? (clave ?? claveAdmin.leer()) : ''
    if (claveEnviada) headers['x-admin-key'] = claveEnviada

    return fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    })
        .catch(() => {
            throw new Error('No se pudo conectar con el servidor. ¿Está la API arrancada?')
        })
        .then((res) => res.json()
            .catch(() => ({}))
            .then((payload) => {
                if (!res.ok) {
                    const error = new Error(payload.message || `Error ${res.status}`)
                    error.status = res.status
                    throw error
                }
                return payload.data
            }))
}

/* Los ids van codificados: un id manipulado en la URL (p. ej. ../recomendaciones) no puede cambiar la ruta */
const idSeguro = (id) => encodeURIComponent(String(id))

/* Atajos por recurso para que las páginas lean como frases; admin: true en los que exigen la clave */
const api = {
    peliculas: {
        listar: (query) => apiFetch('/peliculas', { query }),
        generos: () => apiFetch('/peliculas/generos'),
        obtener: (id) => apiFetch(`/peliculas/${idSeguro(id)}`),
        relacionadas: (id) => apiFetch(`/peliculas/${idSeguro(id)}/relacionadas`),
        crear: (body) => apiFetch('/peliculas', { method: 'POST', body, admin: true }),
        reemplazar: (id, body) => apiFetch(`/peliculas/${idSeguro(id)}`, { method: 'PUT', body, admin: true }),
        modificar: (id, body) => apiFetch(`/peliculas/${idSeguro(id)}`, { method: 'PATCH', body, admin: true }),
        borrar: (id) => apiFetch(`/peliculas/${idSeguro(id)}`, { method: 'DELETE', admin: true })
    },
    noticias: {
        listar: (query) => apiFetch('/noticias', { query }),
        obtener: (id) => apiFetch(`/noticias/${idSeguro(id)}`),
        crear: (body) => apiFetch('/noticias', { method: 'POST', body, admin: true }),
        reemplazar: (id, body) => apiFetch(`/noticias/${idSeguro(id)}`, { method: 'PUT', body, admin: true }),
        borrar: (id) => apiFetch(`/noticias/${idSeguro(id)}`, { method: 'DELETE', admin: true })
    },
    admin: {
        verificar: (clave) => apiFetch('/admin/verificar', { clave, admin: true })
    },
    tmdb: {
        buscar: (q) => apiFetch('/tmdb/buscar', { query: { q }, admin: true }),
        importar: (tmdbId) => apiFetch(`/tmdb/importar/${idSeguro(tmdbId)}`, { method: 'POST', admin: true })
    },
    recomendaciones: {
        listar: (query) => apiFetch('/recomendaciones', { query, admin: true }),
        crear: (body) => apiFetch('/recomendaciones', { method: 'POST', body }),
        modificar: (id, body) => apiFetch(`/recomendaciones/${idSeguro(id)}`, { method: 'PATCH', body, admin: true }),
        borrar: (id) => apiFetch(`/recomendaciones/${idSeguro(id)}`, { method: 'DELETE', admin: true })
    }
}
