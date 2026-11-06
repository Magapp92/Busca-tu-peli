/* 404: ninguna ruta coincide */
const notFound = (req, res, next) => {
    const error = new Error('Endpoint no existe')
    error.status = 404
    next(error)
}

/* Errores centralizados: validación de Mongoose e ids mal formados son 400.
   Los errores internos (500) no enseñan su detalle al público: se quedan en el log */
const errorHandler = (error, req, res, next) => {
    let { status, message } = error

    if (error.name === 'ValidationError') {
        status = 400
        message = Object.values(error.errors).map((e) => e.message).join('. ')
    }

    if (error.name === 'CastError') {
        status = 400
        message = `Valor no válido en ${error.path}`
    }

    /* JSON mal formado o demasiado grande */
    if (error.type === 'entity.parse.failed') {
        status = 400
        message = 'El cuerpo de la petición no es un JSON válido'
    }
    if (error.type === 'entity.too.large') {
        status = 413
        message = 'La petición es demasiado grande'
    }

    status = status || 500
    if (status >= 500) {
        console.error(`Error ${status} en ${req.method} ${req.originalUrl}: ${error.stack || error.message}`)
        if (!error.status) message = 'Error interno del servidor, inténtalo de nuevo más tarde'
    }

    res.status(status).json({ message: message || 'Error interno del servidor', data: null })
}

/* Límites de peticiones por IP (en Netlify la IP real llega en x-nf-client-connection-ip).
   En Netlify cada instancia de la función lleva su propia cuenta: frena ataques automáticos, no es un muro absoluto */
const rateLimit = require('express-rate-limit')

const limitador = (opciones) => rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.get('x-nf-client-connection-ip') || req.ip || 'desconocida',
    validate: { ip: false, trustProxy: false, xForwardedForHeader: false },
    handler: (req, res, next, o) => res.status(429).json({ message: o.message, data: null }),
    ...opciones
})

/* Uso general de la API: 300 peticiones por minuto */
const limiteGeneral = limitador({ windowMs: 60 * 1000, limit: 300, message: 'Demasiadas peticiones, espera un momento' })

/* Rutas de admin: 10 claves incorrectas (401) cada 15 minutos contra la fuerza bruta; el resto de respuestas no cuenta */
const limiteAdmin = limitador({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    requestWasSuccessful: (req, res) => res.statusCode !== 401,
    message: 'Demasiados intentos fallidos. Vuelve a intentarlo en 15 minutos'
})

/* Formulario público de recomendaciones: 5 envíos por hora */
const limiteRecomendaciones = limitador({ windowMs: 60 * 60 * 1000, limit: 5, message: 'Has enviado muchas sugerencias seguidas. Inténtalo dentro de un rato' })

/* Rutas de administración: exigen la cabecera x-admin-key igual a ADMIN_KEY.
   En local, si no hay ADMIN_KEY en .env, se permite (para trabajar cómodo);
   en producción sin ADMIN_KEY se bloquea todo, nunca queda abierto por olvido */
const crypto = require('crypto')

const iguales = (a, b) => {
    const x = Buffer.from(String(a))
    const y = Buffer.from(String(b))
    return x.length === y.length && crypto.timingSafeEqual(x, y)
}

const requireAdmin = (req, res, next) => {
    const clave = process.env.ADMIN_KEY

    if (!clave) {
        if (process.env.EN_PRODUCCION === 'true') {
            return res.status(503).json({ message: 'Falta configurar ADMIN_KEY en el servidor', data: null })
        }
        return next()
    }

    if (!iguales(req.get('x-admin-key') || '', clave)) {
        return res.status(401).json({ message: 'Clave de administrador incorrecta', data: null })
    }
    next()
}

module.exports = {
    notFound,
    errorHandler,
    requireAdmin,
    limiteGeneral,
    limiteAdmin,
    limiteRecomendaciones
}
