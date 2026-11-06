/* Cliente único de la API. La API responde siempre { message, data }:
   devolvemos data si va bien y lanzamos un Error con message si no */

/* La API vive en el mismo dominio (/buscatupeli): en local la sirve Express y en
   buscatupeli.com la función de Netlify. Solo con Live Server u otro servidor de
   desarrollo apuntamos a localhost:3100 */
const SERVIDOR_DEV = location.protocol === 'file:' || ['5500', '5501', '5173', '8080'].includes(location.port)
const BASE_URL = window.BUSCATUPELI_API || (SERVIDOR_DEV ? 'http://localhost:3100/buscatupeli' : '/buscatupeli')

/* Token de sesión del panel (lo da POST /login y caduca a las 8 h): se guarda solo durante la sesión del navegador */
const SESION_ADMIN = 'buscatupeli-token'

const sesionAdmin = {
    leer: () => { try { return sessionStorage.getItem(SESION_ADMIN) || '' } catch { return '' } },
    guardar: (token) => { try { sessionStorage.setItem(SESION_ADMIN, token) } catch { /* sin almacenamiento */ } },
    borrar: () => { try { sessionStorage.removeItem(SESION_ADMIN) } catch { /* sin almacenamiento */ } }
}

/* Hace la petición y devuelve una promesa con data; si la API responde error, la promesa se rechaza con su message */
const apiFetch = (path, { method = 'GET', body, query, admin = false } = {}) => {
    const url = new URL(BASE_URL + path, location.origin)
    if (query) {
        Object.entries(query).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
        })
    }

    /* El token del panel solo viaja en las peticiones de administración, nunca en las públicas */
    const headers = { 'Content-Type': 'application/json' }
    const token = admin ? sesionAdmin.leer() : ''
    if (token) headers.Authorization = `Bearer ${token}`

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
                    /* Si el token del panel ha caducado o no vale, lo olvidamos: al recargar se pedirá la clave */
                    if (admin && res.status === 401) sesionAdmin.borrar()
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
        /* El login no lleva token: con la clave correcta devuelve uno nuevo */
        login: (clave) => apiFetch('/login', { method: 'POST', body: { clave } }),
        verificar: () => apiFetch('/admin/verificar', { admin: true })
    },
    tmdb: {
        buscar: (q) => apiFetch('/tmdb/buscar', { query: { q }, admin: true }),
        importar: (tmdbId) => apiFetch(`/tmdb/importar/${idSeguro(tmdbId)}`, { method: 'POST', admin: true })
    },
    suscripciones: {
        crear: (body) => apiFetch('/suscripciones', { method: 'POST', body })
    },
    recomendaciones: {
        listar: (query) => apiFetch('/recomendaciones', { query, admin: true }),
        crear: (body) => apiFetch('/recomendaciones', { method: 'POST', body }),
        modificar: (id, body) => apiFetch(`/recomendaciones/${idSeguro(id)}`, { method: 'PATCH', body, admin: true }),
        borrar: (id) => apiFetch(`/recomendaciones/${idSeguro(id)}`, { method: 'DELETE', admin: true })
    }
}
