
/* Noticias generadas con datos de TMDB: las más populares de la semana y las mejor valoradas de cada plataforma.
Las usan el script `npm run noticias` y la función programada de Netlify (cada lunes) */
const { Pelicula, Noticia } = require('../models')
const { obtenerValoracion, tendencias, buscar, obtenerPelicula, existente } = require('./tmdb')

const NOMBRES = { netflix: 'Netflix', prime: 'Prime Video', disney: 'Disney+', max: 'Max', appletv: 'Apple TV+' }
const TOP_PLATAFORMA = 5
const TOP_POPULARES = 10
/* Mínimo de votos en TMDB para que una nota se considere fiable */
const MIN_VOTOS = 300

const nota = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const fechaCorta = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

/* Las películas del catálogo original no tienen id de TMDB: lo buscamos por título y año
y solo lo guardamos si coincide exactamente (título original o en español, año ±1) */
const normalizar = (s = '') => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')

const enlazarConTmdb = async () => {
    const sinId = await Pelicula.find({ tmdbId: { $exists: false } }, { titulo: 1, tituloOriginal: 1, anio: 1 })
    let enlazadas = 0
    for (const p of sinId) {
        const candidatas = await buscar(p.tituloOriginal || p.titulo).catch(() => [])
        const igual = candidatas.find((c) => Math.abs((c.anio || 0) - p.anio) <= 1 &&
            (normalizar(c.tituloOriginal) === normalizar(p.tituloOriginal) || normalizar(c.titulo) === normalizar(p.titulo)))
        if (igual && !(await Pelicula.exists({ tmdbId: igual.tmdbId }))) {
            await Pelicula.updateOne({ _id: p._id }, { $set: { tmdbId: igual.tmdbId } })
            enlazadas++
        }
    }
    return enlazadas
}

/* Refresca nota, votos y popularidad de las películas importadas de TMDB (de 10 en 10 para no saturar la API) */
const actualizarValoraciones = async () => {
    const pelis = await Pelicula.find({ tmdbId: { $exists: true } }, { tmdbId: 1 })
    const cambios = []
    for (let i = 0; i < pelis.length; i += 10) {
        const lote = await Promise.allSettled(pelis.slice(i, i + 10).map((p) => obtenerValoracion(p.tmdbId)))
        lote.forEach((r, j) => {
            if (r.status === 'fulfilled') cambios.push({ updateOne: { filter: { _id: pelis[i + j]._id }, update: { $set: r.value } } })
        })
    }
    if (cambios.length) await Pelicula.bulkWrite(cambios)
    return { total: pelis.length, actualizadas: cambios.length }
}

/* Una entrada del ranking a partir de una película del catálogo */
const entradaCatalogo = (p, i) => ({
    posicion: i + 1,
    titulo: p.titulo,
    anio: p.anio,
    poster: p.poster,
    valoracion: p.valoracion,
    votos: p.votos,
    plataformas: p.plataformas.map((pl) => pl.clave),
    pelicula: p._id
})

/* "Las 5 mejor valoradas de <plataforma>" con las películas del catálogo y su nota en TMDB */
const noticiaPlataforma = (clave, pelis, fecha, usadas) => {
    const nombre = NOMBRES[clave]
    const top = pelis.slice(0, TOP_PLATAFORMA)
    const [primera] = top
    const media = top.reduce((s, p) => s + p.valoracion, 0) / top.length
    /* Imagen: la de la primera película con fondo apaisado que no haya usado otra noticia */
    const conFondo = top.filter((p) => p.backdrop)
    const imagen = (conFondo.find((p) => !usadas.has(p.backdrop)) || conFondo[0] || primera).backdrop || primera.poster
    usadas.add(imagen)

    return {
        clave: `valoradas-${clave}`,
        titulo: `Las ${top.length} películas mejor valoradas que puedes ver en ${nombre}`,
        entradilla: `«${primera.titulo}» encabeza la lista con un ${nota(primera.valoracion)} de media. Estas son las películas de ${nombre} en nuestro catálogo que mejor puntúan los espectadores.`,
        categoria: nombre,
        imagen,
        fecha,
        parrafos: [
            `Para elaborar esta lista hemos cruzado las películas disponibles con suscripción en ${nombre} España con la valoración media que les dan los usuarios de TMDB (The Movie Database), una de las mayores bases de datos de cine del mundo.`,
            `Solo tenemos en cuenta las películas con más de ${MIN_VOTOS} votos, para que la nota sea representativa. La media de este top ${top.length} es de ${nota(media)} sobre 10, y «${primera.titulo}» (${primera.anio}) se lleva el primer puesto con ${primera.votos.toLocaleString('es-ES')} votos.`,
            `Actualizamos este ranking cada semana con las notas más recientes y los cambios en el catálogo de ${nombre}. Pulsa cualquier película para ver su ficha, el tráiler y dónde verla.`
        ],
        lista: [],
        ranking: top.map(entradaCatalogo)
    }
}

/* "Las más populares de la semana" según las tendencias de TMDB, marcando las que están en el catálogo */
/* Las películas en tendencia que aún no están en el catálogo se importan desde TMDB con su ficha completa,
para que en la noticia todas sean clicables y tengan su página. Si alguna ya estaba (p. ej. con otro id),
se reutiliza; si TMDB no tiene datos suficientes (sin póster), se deja fuera del catálogo */
const importarQueFalten = async ( lista ) => {
    const yaEstan = new Set((await Pelicula.find({ tmdbId: { $in: lista.map(( m ) => m.tmdbId) } }, { tmdbId: 1 })).map(( p ) => p.tmdbId))
    const faltan = lista.filter(( m ) => !yaEstan.has(m.tmdbId))
    let importadas = 0
    for (let i = 0; i < faltan.length; i += 5) {
        const lote = await Promise.allSettled(faltan.slice(i, i + 5).map(async ( m ) => {
            const pelicula = await obtenerPelicula(m.tmdbId)
            const repetida = await existente(pelicula)
            if (repetida) return Pelicula.updateOne({ _id: repetida._id }, { $set: { tmdbId: pelicula.tmdbId } })
            if (!pelicula.poster) throw new Error(`«${pelicula.titulo}» no tiene póster en TMDB`)
            await Pelicula.create(pelicula)
            importadas++
        }))
        lote.filter(( r ) => r.status === 'rejected').forEach(( r ) => console.log(`No se pudo importar una película en tendencia: ${r.reason.message}`))
    }
    return importadas
}

/* Las películas del catálogo que aún no están en ninguna plataforma (estrenos de cine importados desde las tendencias)
se vuelven a consultar cada semana: cuando llegan al streaming en España, su ficha muestra ya dónde verlas */
const actualizarPlataformasPendientes = async () => {
    const pendientes = await Pelicula.find({ tmdbId: { $exists: true }, plataformas: { $size: 0 } }, { tmdbId: 1 })
    let actualizadas = 0
    for (let i = 0; i < pendientes.length; i += 5) {
        const lote = await Promise.allSettled(pendientes.slice(i, i + 5).map(( p ) => obtenerPelicula(p.tmdbId)))
        for (const [j, r] of lote.entries()) {
            if (r.status === 'fulfilled' && r.value.plataformas.length) {
                await Pelicula.updateOne({ _id: pendientes[i + j]._id }, { $set: { plataformas: r.value.plataformas } })
                actualizadas++
            }
        }
    }
    return { pendientes: pendientes.length, actualizadas }
}

const noticiaPopulares = async (fecha) => {
    const lista = (await tendencias()).slice(0, TOP_POPULARES)
    const importadas = await importarQueFalten(lista)
    const enCatalogo = await Pelicula.find({ tmdbId: { $in: lista.map((m) => m.tmdbId) } })
    const porId = new Map(enCatalogo.map((p) => [p.tmdbId, p]))
    const [primera] = lista
    /* Las que se pueden ver ya en alguna plataforma en España */
    const enStreaming = lista.filter((m) => porId.get(m.tmdbId)?.plataformas.length)
    const inicioSemana = new Date(fecha.getTime() - 6 * 24 * 3600 * 1000)
    const nombre = ( m ) => `«${porId.get(m.tmdbId).titulo}»`

    const noticia = {
        clave: 'populares-semana',
        titulo: 'Las películas más populares de la semana',
        entradilla: `«${primera.titulo}» lidera las tendencias de esta semana. Repasamos las ${lista.length} películas de las que más se está hablando y te decimos cuáles puedes ver ya en streaming.`,
        categoria: 'Tendencias',
        imagen: (porId.get(primera.tmdbId)?.backdrop) || primera.backdrop || primera.poster,
        fecha,
        parrafos: [
            `Esta es la lista de películas en tendencia entre el ${fechaCorta(inicioSemana)} y el ${fechaCorta(fecha)} según TMDB (The Movie Database). La popularidad se calcula con la actividad de sus usuarios: búsquedas, visitas a la ficha, votos y listas; no son datos de audiencia de las plataformas.`,
            enStreaming.length
                ? `${enStreaming.length === 1 ? 'Una de ellas se puede' : `${enStreaming.length} de ellas se pueden`} ver ya en streaming en España: ${enStreaming.map(nombre).join(', ')}. El resto son estrenos que todavía no han llegado a ninguna plataforma. Pulsa en cualquiera para ver su ficha, el tráiler y el reparto.`
                : 'Ninguna de ellas ha llegado todavía a las plataformas de streaming en España: muchas son estrenos de cine. Pulsa en cualquiera para ver su ficha, el tráiler y el reparto; en cuanto estén disponibles, lo verás en su página.',
            'Actualizamos esta lista cada lunes. Si echas en falta alguna película en el catálogo, puedes recomendárnosla desde la sección Recomendar.'
        ],
        lista: [],
        ranking: lista.map((m, i) => {
            const p = porId.get(m.tmdbId)
            return p
                ? entradaCatalogo(p, i)
                : { posicion: i + 1, titulo: m.titulo, anio: m.anio, poster: m.poster, valoracion: m.valoracion, votos: m.votos, plataformas: [] }
        })
    }
    return { noticia, importadas }
}

/* Genera (o actualiza por su clave) todas las noticias de datos */
const generarNoticias = async () => {
    const enlazadas = await enlazarConTmdb()
    const valoraciones = { ...(await actualizarValoraciones()), enlazadas }
    const plataformas = await actualizarPlataformasPendientes()
    const ahora = new Date()
    const { noticia: populares, importadas } = await noticiaPopulares(ahora)
    const todas = [populares]
    const usadas = new Set([todas[0].imagen])

    /* Restamos unos segundos a cada noticia para fijar el orden: primero las populares y luego las plataformas */
    for (const [i, clave] of Object.keys(NOMBRES).entries()) {
        const pelis = await Pelicula
            .find({ 'plataformas.clave': clave, votos: { $gte: MIN_VOTOS } })
            .sort({ valoracion: -1, votos: -1 })
            .limit(TOP_PLATAFORMA)
        if (pelis.length) todas.push(noticiaPlataforma(clave, pelis, new Date(ahora.getTime() - (i + 1) * 1000), usadas))
    }

    await Noticia.bulkWrite(todas.map((n) => ({
        updateOne: { filter: { clave: n.clave }, update: { $set: n }, upsert: true }
    })))

    return { valoraciones, importadas, plataformas, noticias: todas.map((n) => `${n.titulo} (${n.ranking.length})`) }
}

/* Exportamos el generador para el script npm run noticias y la función semanal */
module.exports = {
    generarNoticias
}
