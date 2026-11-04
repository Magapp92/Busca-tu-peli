/* 404: ninguna ruta coincide */
const notFound = (req, res, next) => {
    const error = new Error('Endpoint no existe')
    error.status = 404
    next(error)
}

/* Errores centralizados: validación de Mongoose e ids mal formados son 400 */
const errorHandler = (error, req, res, next) => {
    let { status, message } = error

    if (error.name === 'ValidationError') {
        status = 400
        message = Object.values(error.errors).map((e) => e.message).join('. ')
    }

    if (error.name === 'CastError') {
        status = 400
        message = `Valor no válido: ${error.value}`
    }

    status = status || 500
    message = message || 'Error interno'

    res.status(status).json({ message, data: null })
}

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
    requireAdmin
}
