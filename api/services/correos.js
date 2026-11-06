
/* Correos con Brevo (brevo.com, plan gratuito: 300 correos al día).
Envía los correos automáticos (confirmar suscripción, agradecer una sugerencia, avisarnos de ella)
y la newsletter semanal a la lista de suscriptores. La clave va en BREVO_API_KEY (.env y Netlify) */
const { Pelicula, Noticia } = require('../models')

const API = 'https://api.brevo.com/v3'
/* Remitente y buzón del equipo: el dominio buscatupeli.com está autenticado en Brevo (DKIM y DMARC) */
const REMITENTE = { name: 'Busca tu peli', email: 'info@buscatupeli.com' }
const BUZON_EQUIPO = 'info@buscatupeli.com'
/* Las imágenes y enlaces de los correos siempre apuntan a la web publicada */
const WEB = 'https://buscatupeli.com'
const NOMBRE_LISTA = 'Suscriptores Busca tu peli'
const NOMBRES_PLATAFORMA = { netflix: 'Netflix', prime: 'Prime Video', disney: 'Disney+', max: 'Max', appletv: 'Apple TV+' }

const errorConStatus = ( mensaje, status ) => Object.assign(new Error(mensaje), { status })

/* Llamada a la API de Brevo: devuelve el JSON o lanza un error con el mensaje de Brevo (solo para el log) */
const brevo = async ( ruta, { method = 'GET', body } = {} ) => {
    const clave = process.env.BREVO_API_KEY
    if (!clave) throw errorConStatus('Falta BREVO_API_KEY en el servidor', 503)

    const res = await fetch(API + ruta, {
        method,
        headers: { 'api-key': clave, accept: 'application/json', 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    })
    const texto = await res.text()
    const datos = texto ? JSON.parse(texto) : null
    if (!res.ok) throw errorConStatus(`Brevo ${res.status} en ${ruta}: ${datos?.message || texto}`, 502)
    return datos
}

/* Escapa el texto que escribe el usuario antes de meterlo en el HTML del correo */
const escapar = ( valor = '' ) => String(valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/* Las rutas de assets/ se convierten en direcciones completas de la web para que se vean en el correo */
const urlAbsoluta = ( ruta = '' ) => (/^https:\/\//.test(ruta) ? ruta : `${WEB}/${ruta.replace(/^\//, '')}`)

const nota = ( n ) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })


/* PLANTILLA BASE DE TODOS LOS CORREOS */

/* Maqueta con tablas y estilos en línea, que es lo que entienden Gmail, Outlook y los móviles */
const plantilla = ({ preheader = '', titulo, cuerpo, boton, pie = '' }) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(titulo)}</title></head>
<body style="margin:0;padding:0;background:#eef1f4;font-family:Arial,Helvetica,sans-serif;color:#1d2530">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapar(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f4;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#07090d;padding:22px 28px">
<a href="${WEB}" style="color:#07c5d6;font-size:22px;font-weight:bold;text-decoration:none">Busca tu peli</a>
<div style="color:#93a0b0;font-size:13px;margin-top:4px">Dónde ver cada película, sin saltar de app en app</div>
</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#07090d">${escapar(titulo)}</h1>
${cuerpo}
${boton ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="background:#07c5d6;border-radius:999px">
<a href="${boton.url}" style="display:inline-block;padding:14px 26px;color:#001417;font-weight:bold;font-size:16px;text-decoration:none">${escapar(boton.texto)}</a>
</td></tr></table>` : ''}
</td></tr>
<tr><td style="padding:18px 28px;background:#f6f8fa;color:#6b7785;font-size:12px;line-height:1.5">
${pie}
<div>Busca tu peli · <a href="${WEB}" style="color:#0b9ba8">buscatupeli.com</a> · <a href="mailto:${BUZON_EQUIPO}" style="color:#0b9ba8">${BUZON_EQUIPO}</a></div>
</td></tr>
</table>
</td></tr></table>
</body></html>`

const parrafo = ( html ) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6">${html}</p>`

/* Envía un correo suelto (transaccional) */
const enviarCorreo = ({ para, asunto, html, texto, responderA, etiqueta }) => brevo('/smtp/email', {
    method: 'POST',
    body: {
        sender: REMITENTE,
        to: [{ email: para }],
        subject: asunto,
        htmlContent: html,
        textContent: texto,
        ...(responderA ? { replyTo: { email: responderA } } : {}),
        ...(etiqueta ? { tags: [etiqueta] } : {})
    }
})


/* SUSCRIPCIONES */

/* Id de la lista de suscriptores en Brevo: si no existe la creamos (se guarda en memoria) */
let idLista = null
const idListaSuscriptores = async () => {
    if (idLista) return idLista
    const { lists = [] } = await brevo('/contacts/lists?limit=50')
    const existente = lists.find(( l ) => l.name === NOMBRE_LISTA)
    if (existente) return (idLista = existente.id)

    const { folders = [] } = await brevo('/contacts/folders?limit=10')
    const carpeta = folders[0]?.id || (await brevo('/contacts/folders', { method: 'POST', body: { name: 'Busca tu peli' } })).id
    const creada = await brevo('/contacts/lists', { method: 'POST', body: { name: NOMBRE_LISTA, folderId: carpeta } })
    return (idLista = creada.id)
}

/* Añade a la lista un email que ya ha confirmado; si se había dado de baja antes, vuelve a recibir correos */
const anadirSuscriptor = async ( email ) => brevo('/contacts', {
    method: 'POST',
    body: { email, listIds: [await idListaSuscriptores()], updateEnabled: true, emailBlacklisted: false }
})

/* Correo con el enlace para confirmar la suscripción (doble confirmación) */
const enviarConfirmacionSuscripcion = ( email, urlConfirmar ) => enviarCorreo({
    para: email,
    asunto: 'Confirma tu suscripción a Busca tu peli',
    etiqueta: 'confirmar-suscripcion',
    html: plantilla({
        preheader: 'Un clic y cada lunes te contamos qué ver',
        titulo: 'Confirma tu suscripción',
        cuerpo: parrafo('Hemos recibido una petición para suscribir este correo a la newsletter de Busca tu peli.')
            + parrafo('Cada lunes te enviaremos <b>las películas más populares de la semana</b>, las <b>mejor valoradas de cada plataforma</b> y las <b>novedades del catálogo</b>, con dónde verlas.')
            + parrafo('Para empezar a recibirla, confirma tu suscripción. El enlace caduca en 48 horas.'),
        boton: { texto: 'Confirmar suscripción', url: urlConfirmar },
        pie: '<div style="margin-bottom:8px">Si no has sido tú, ignora este correo: no te suscribiremos sin tu confirmación.</div>'
    }),
    texto: `Confirma tu suscripción a la newsletter de Busca tu peli abriendo este enlace (caduca en 48 horas): ${urlConfirmar}\n\nSi no has sido tú, ignora este correo.`
})


/* SUGERENCIAS */

/* Agradecimiento a quien sugiere una película, con invitación a suscribirse (sin suscribirle) */
const enviarGraciasSugerencia = ({ nombre, email, pelicula }) => enviarCorreo({
    para: email,
    asunto: `¡Gracias por tu sugerencia, ${nombre.split(' ')[0]}!`,
    etiqueta: 'gracias-sugerencia',
    html: plantilla({
        preheader: 'Ya está en nuestra lista de pendientes',
        titulo: `¡Gracias, ${nombre.split(' ')[0]}!`,
        cuerpo: parrafo(`Hemos recibido tu sugerencia: <b>${escapar(pelicula.slice(0, 300))}</b>.`)
            + parrafo('La revisaremos y, si está disponible en Netflix, Prime Video, Disney+, Max o Apple TV+ en España, la añadiremos al catálogo.')
            + parrafo('¿Quieres estar al día de todo? <b>Suscríbete a nuestra newsletter</b> y cada lunes te contamos qué películas están de moda, las mejor valoradas de cada plataforma y las novedades del catálogo.'),
        boton: { texto: 'Quiero la newsletter', url: `${WEB}/?suscribirse=1#newsletter` },
        pie: '<div style="margin-bottom:8px">Recibes este correo porque has enviado una sugerencia en buscatupeli.com. No te hemos suscrito a nada.</div>'
    }),
    texto: `¡Gracias, ${nombre}! Hemos recibido tu sugerencia: ${pelicula}. La revisaremos y, si está disponible en alguna plataforma en España, la añadiremos al catálogo.\n\n¿Quieres estar al día? Suscríbete a la newsletter: ${WEB}/?suscribirse=1#newsletter`
})

/* Aviso al equipo con los datos de la sugerencia; al responder, la respuesta va al usuario */
const enviarAvisoSugerencia = ({ nombre, email, pelicula }) => enviarCorreo({
    para: BUZON_EQUIPO,
    responderA: email,
    asunto: `Nueva sugerencia: ${pelicula.slice(0, 80)}`,
    etiqueta: 'aviso-sugerencia',
    html: plantilla({
        titulo: 'Nueva sugerencia de película',
        cuerpo: parrafo(`<b>Película:</b> ${escapar(pelicula)}`)
            + parrafo(`<b>Nombre:</b> ${escapar(nombre)}`)
            + parrafo(`<b>Email:</b> ${escapar(email)}`)
            + parrafo('Puedes cambiar su estado en el panel de administración, pestaña Sugerencias. Si respondes a este correo, la respuesta le llega directamente a quien la ha sugerido.'),
        boton: { texto: 'Abrir el panel', url: `${WEB}/admin.html` }
    }),
    texto: `Nueva sugerencia de película\nPelícula: ${pelicula}\nNombre: ${nombre}\nEmail: ${email}\nPanel: ${WEB}/admin.html`
})


/* NEWSLETTER SEMANAL */

/* Bloque de una película: póster, título, nota y dónde verla, enlazando a su ficha
(etiqueta opcional encima del título, p. ej. "La mejor de Netflix") */
const filaPelicula = ( p, etiqueta = '' ) => `
<tr><td style="padding:10px 0;border-top:1px solid #e6eaee">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td width="64" valign="top"><a href="${WEB}/pelicula.html?id=${p._id}"><img src="${escapar(urlAbsoluta(p.poster))}" width="56" alt="" style="display:block;border-radius:6px;border:0"></a></td>
<td valign="middle" style="padding-left:12px">
${etiqueta ? `<div style="font-size:12px;font-weight:bold;color:#0b9ba8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">${escapar(etiqueta)}</div>` : ''}
<a href="${WEB}/pelicula.html?id=${p._id}" style="color:#07090d;font-weight:bold;font-size:16px;text-decoration:none">${escapar(p.titulo)}</a>
<span style="color:#6b7785;font-size:13px">${p.anio ? ` (${p.anio})` : ''}</span>
<div style="font-size:13px;color:#6b7785;margin-top:3px">${p.votos ? `★ ${nota(p.valoracion)} · ` : ''}${(p.plataformas || []).map(( pl ) => NOMBRES_PLATAFORMA[pl.clave || pl]).filter(Boolean).join(', ')}</div>
</td></tr></table>
</td></tr>`

const seccion = ( titulo, filas ) => (filas.length
    ? `<h2 style="margin:26px 0 6px;font-size:18px;color:#07090d">${escapar(titulo)}</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas.join('')}</table>`
    : '')

/* Reúne el contenido de la semana: novedades del catálogo, populares que tenemos y la mejor de cada plataforma */
const contenidoNewsletter = async () => {
    const haceUnaSemana = new Date(Date.now() - 7 * 24 * 3600 * 1000)
    const novedades = await Pelicula.find({ createdAt: { $gte: haceUnaSemana } }).sort({ createdAt: -1 }).limit(6)

    /* Del ranking de populares solo enseñamos las que están en el catálogo (con dónde verlas) */
    const populares = await Noticia.findOne({ clave: 'populares-semana' })
    const idsPopulares = (populares?.ranking || []).filter(( r ) => r.pelicula).map(( r ) => r.pelicula)
    const popularesCatalogo = idsPopulares.length ? await Pelicula.find({ _id: { $in: idsPopulares } }).limit(5) : []
    /* Si esta semana ninguna popular está en el catálogo, enseñamos las más populares del catálogo según TMDB */
    const tendencia = popularesCatalogo.length ? popularesCatalogo : await Pelicula.find({ popularidad: { $gt: 0 } }).sort({ popularidad: -1 }).limit(5)

    /* Ninguna película se repite entre secciones */
    const usadas = new Set([...novedades, ...tendencia].map(( p ) => String(p._id)))

    /* La mejor de cada plataforma según las noticias de mejor valoradas: si la número 1 ya ha salido
    (p. ej. porque es la mejor en varias plataformas) cogemos la siguiente de esa plataforma */
    const mejores = []
    for (const clave of Object.keys(NOMBRES_PLATAFORMA)) {
        const noticia = await Noticia.findOne({ clave: `valoradas-${clave}` })
        const entrada = (noticia?.ranking || []).find(( r ) => r.pelicula && !usadas.has(String(r.pelicula)))
        const pelicula = entrada && await Pelicula.findById(entrada.pelicula)
        if (pelicula) {
            usadas.add(String(pelicula._id))
            mejores.push({ pelicula, etiqueta: `La mejor de ${NOMBRES_PLATAFORMA[clave]}` })
        }
    }

    return { novedades, tendencia, mejores, hayPopularesEnCatalogo: popularesCatalogo.length > 0 }
}

/* HTML de la newsletter; enlaceBaja es el marcador de Brevo ({{ unsubscribe }}) o # en las pruebas */
const htmlNewsletter = ({ novedades, tendencia, mejores, hayPopularesEnCatalogo }, enlaceBaja) => {
    const destacada = novedades[0] || tendencia[0] || mejores[0]?.pelicula
    return plantilla({
        preheader: destacada ? `Esta semana: ${destacada.titulo} y mucho más` : 'Qué ver esta semana',
        titulo: 'Qué ver esta semana',
        cuerpo: parrafo('Te traemos lo más interesante de la semana en Netflix, Prime Video, Disney+, Max y Apple TV+, y dónde ver cada película.')
            + seccion('Recién llegadas al catálogo', novedades.map(( p ) => filaPelicula(p)))
            + seccion(hayPopularesEnCatalogo ? 'Las más populares de la semana' : 'Lo más popular de nuestro catálogo', tendencia.map(( p ) => filaPelicula(p)))
            + seccion('La mejor valorada de cada plataforma', mejores.map(( m ) => filaPelicula(m.pelicula, m.etiqueta)))
            + parrafo('<br>¿Echas en falta alguna película? <a href="' + WEB + '/recomendaciones.html" style="color:#0b9ba8">Recomiéndanosla</a> y te avisamos cuando la añadamos.'),
        boton: { texto: 'Ver qué ver esta semana', url: `${WEB}/noticias.html` },
        pie: `<div style="margin-bottom:8px">Recibes este correo porque te suscribiste en buscatupeli.com. <a href="${enlaceBaja}" style="color:#0b9ba8">Darse de baja</a></div>`
    })
}

/* Envía la newsletter de la semana. Con { prueba: email } la manda solo a ese correo (sin campaña);
si no, crea una campaña en Brevo para la lista de suscriptores y la envía ya */
const enviarNewsletter = async ({ prueba } = {}) => {
    const contenido = await contenidoNewsletter()
    const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
    const asunto = `Qué ver esta semana · ${fecha}`

    if (prueba) {
        await enviarCorreo({ para: prueba, asunto: `[Prueba] ${asunto}`, html: htmlNewsletter(contenido, '#'), etiqueta: 'newsletter-prueba' })
        return { enviada: true, a: prueba }
    }

    /* Sin suscriptores confirmados no se crea la campaña (contamos los contactos de la lista:
    el contador de la propia lista en Brevo se actualiza con retraso) */
    const { count: suscriptores = 0 } = await brevo(`/contacts/lists/${await idListaSuscriptores()}/contacts?limit=1`)
    if (!suscriptores) return { enviada: false, motivo: 'La lista no tiene suscriptores todavía' }

    const campana = await brevo('/emailCampaigns', {
        method: 'POST',
        body: {
            name: `Newsletter ${new Date().toISOString().slice(0, 10)}`,
            subject: asunto,
            sender: REMITENTE,
            replyTo: BUZON_EQUIPO,
            htmlContent: htmlNewsletter(contenido, '{{ unsubscribe }}'),
            recipients: { listIds: [await idListaSuscriptores()] }
        }
    })
    await brevo(`/emailCampaigns/${campana.id}/sendNow`, { method: 'POST' })
    return { enviada: true, campana: campana.id, suscriptores }
}

/* Exportamos las funciones para los controllers, los scripts y la función semanal */
module.exports = {
    anadirSuscriptor,
    enviarConfirmacionSuscripcion,
    enviarGraciasSugerencia,
    enviarAvisoSugerencia,
    enviarNewsletter
}
