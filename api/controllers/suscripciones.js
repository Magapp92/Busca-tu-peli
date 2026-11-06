
/* Controlador de suscripciones a la newsletter con doble confirmación: el formulario del footer
crea la suscripción pendiente y manda un correo con un enlace; al pulsarlo queda confirmada y se añade a Brevo */
const crypto = require('crypto')
const { Suscripcion } = require('../models')
const { anadirSuscriptor, enviarConfirmacionSuscripcion } = require('../services/correos')

/* La respuesta es siempre la misma: así nadie puede averiguar si un correo ya está suscrito */
const MENSAJE = 'Revisa tu correo: te hemos enviado un enlace para confirmar la suscripción'
const HORAS_TOKEN = 48
/* Si ya le enviamos el enlace hace menos de 10 minutos no lo repetimos (evita llenar su bandeja) */
const ESPERA_REENVIO_MS = 10 * 60 * 1000

/* Dirección base del enlace de confirmación: la web publicada o el servidor local */
const baseUrl = ( req ) => (process.env.EN_PRODUCCION === 'true' ? 'https://buscatupeli.com' : `http://${req.get('host')}`)

/* Pide la suscripción: guarda el email como pendiente y le manda el enlace para confirmar */
const postSuscripcion = async (req, res, next) => {
    try {
        /* Recogemos lo que envía el formulario del footer */
        const { email, consentimiento, web } = req.body || {}

        /* Trampa para bots: el campo oculto "web" nunca lo rellena una persona */
        if (web) {
            return res.status(201).json({ message: MENSAJE, data: null })
        }

        /* Solo texto y con la casilla de consentimiento marcada (RGPD) */
        if (typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ message: 'Introduce tu email', data: null })
        }
        if (consentimiento !== true) {
            return res.status(400).json({ message: 'Para suscribirte tienes que aceptar la política de privacidad', data: null })
        }

        const correo = email.trim().toLowerCase()
        const existente = await Suscripcion.findOne({ email: correo })

        /* Ya confirmada, o enlace enviado hace muy poco: respondemos igual sin mandar nada */
        if (existente?.estado === 'confirmada' || (existente && Date.now() - existente.updatedAt < ESPERA_REENVIO_MS)) {
            return res.status(201).json({ message: MENSAJE, data: null })
        }

        /* Token aleatorio de un solo uso que caduca en 48 horas */
        const token = crypto.randomBytes(32).toString('hex')
        const suscripcion = existente || new Suscripcion({ email: correo })
        suscripcion.token = token
        suscripcion.caducaToken = new Date(Date.now() + HORAS_TOKEN * 3600 * 1000)
        suscripcion.consentimientoEn = new Date()
        await suscripcion.save()

        /* Si el correo no sale, se lo decimos para que lo intente más tarde */
        try {
            await enviarConfirmacionSuscripcion(correo, `${baseUrl(req)}/buscatupeli/suscripciones/confirmar/${token}`)
        } catch (error) {
            console.error(`No se pudo enviar la confirmación de suscripción: ${error.message}`)
            return res.status(502).json({ message: 'No hemos podido enviarte el correo de confirmación. Inténtalo más tarde', data: null })
        }

        res.status(201).json({ message: MENSAJE, data: null })
    } catch (error) {
        next(error)
    }
}

/* Enlace del correo: confirma la suscripción, la añade a la lista de Brevo y vuelve a la web con un aviso */
const getConfirmarSuscripcion = async (req, res, next) => {
    try {
        /* Recogemos el token de la URL: solo vale si existe y no ha caducado */
        const { token } = req.params
        const suscripcion = /^[a-f0-9]{64}$/.test(token)
            ? await Suscripcion.findOne({ token, caducaToken: { $gt: new Date() } })
            : null

        /* Enlace caducado, ya usado o inventado */
        if (!suscripcion) return res.redirect(302, '/?suscripcion=invalida')

        /* Si Brevo falla, el enlace sigue valiendo para intentarlo de nuevo */
        try {
            await anadirSuscriptor(suscripcion.email)
        } catch (error) {
            console.error(`No se pudo añadir el suscriptor a Brevo: ${error.message}`)
            return res.redirect(302, '/?suscripcion=error')
        }

        suscripcion.estado = 'confirmada'
        suscripcion.confirmadaEn = new Date()
        suscripcion.token = undefined
        suscripcion.caducaToken = undefined
        await suscripcion.save()

        res.redirect(302, '/?suscripcion=confirmada')
    } catch (error) {
        next(error)
    }
}


/* Exportamos los controllers para el router */
module.exports = {
postSuscripcion,
getConfirmarSuscripcion
}
