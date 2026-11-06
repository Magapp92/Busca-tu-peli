
/* jsonwebtoken comprueba el token que manda el panel de admin en cada petición de escritura;
express-rate-limit limita las peticiones por IP */
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')

/* Middleware 404: se ejecuta cuando ninguna ruta del router coincide */
const notFound = ( req , res , next ) => {
    const error = new Error(`Endpoint no existe`)
            error.status = 404
    next(error)
}


/* Middleware centralizado de errores: recibe los next(error); sin status responde 500.
Los errores de validación de Mongoose y los ids mal formados son culpa de la petición: 400.
Los errores internos (500) no enseñan su detalle al público: se quedan en el log */
const errorHandler = ( error , req , res , next )=>{
    let { status , message } = error

    if (error.name === 'ValidationError') {
        status = 400
        message = Object.values(error.errors).map(( e ) => e.message).join('. ')
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

        status  = status  || 500

    if (status >= 500) {
        console.error(`Error ${status} en ${req.method} ${req.originalUrl}: ${error.stack || error.message}`)
        if (!error.status) message = 'Error interno del servidor, inténtalo de nuevo más tarde'
    }

        message = message || `Error interno`

    res.status(status).json({ message , data : null })
}

/* Control de acceso de las rutas de escritura: exige un token válido en la cabecera
Authorization (Bearer <token>) y deja en req.usuario el rol que lleva dentro.
En local, si no hay ADMIN_KEY en .env, se deja pasar (para trabajar cómodo);
en producción sin ADMIN_KEY o sin JWT_SECRET se bloquea todo, nunca queda abierto por olvido */
const verificarToken = ( req , res , next ) => {
    const { ADMIN_KEY, JWT_SECRET, EN_PRODUCCION } = process.env

    if (!ADMIN_KEY || !JWT_SECRET) {
        if (EN_PRODUCCION === 'true') {
            return res.status(503).json({ message: 'Falta configurar ADMIN_KEY o JWT_SECRET en el servidor', data: null })
        }
        if (!ADMIN_KEY) return next()
    }

    /* La cabecera llega como 'Bearer <token>': nos quedamos con la segunda parte */
    const token = req.headers.authorization?.split(' ')[1]

    /* Sin token no se puede escribir: respondemos 401 */
    if (!token) {
        return res.status(401).json({ message: 'Necesitas iniciar sesión', data: null })
    }

    /* Si el token es válido guardamos su rol en req.usuario y seguimos; si no, 401 */
    try {
        req.usuario = jwt.verify( token, JWT_SECRET )
        next()
    } catch {
        res.status(401).json({ message: 'Sesión caducada o inválida, vuelve a entrar', data: null })
    }
}

/* Límites de peticiones por IP (en Netlify la IP real llega en x-nf-client-connection-ip).
En Netlify cada copia de la función lleva su propia cuenta: frena ataques automáticos, no es un muro absoluto */
const limitador = ( opciones ) => rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: ( req ) => req.get('x-nf-client-connection-ip') || req.ip || 'desconocida',
    validate: { ip: false, trustProxy: false, xForwardedForHeader: false },
    handler: ( req , res , next , o ) => res.status(429).json({ message: o.message, data: null }),
    ...opciones
})

/* Uso general de la API: 300 peticiones por minuto */
const limiteGeneral = limitador({ windowMs: 60 * 1000, limit: 300, message: 'Demasiadas peticiones, espera un momento' })

/* Login y rutas de admin: 10 respuestas 401 cada 15 minutos contra la fuerza bruta de la clave; el resto no cuenta */
const limiteAdmin = limitador({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    requestWasSuccessful: ( req , res ) => res.statusCode !== 401,
    message: 'Demasiados intentos fallidos. Vuelve a intentarlo en 15 minutos'
})

/* Formulario público de recomendaciones: 5 envíos por hora */
const limiteRecomendaciones = limitador({ windowMs: 60 * 60 * 1000, limit: 5, message: 'Has enviado muchas sugerencias seguidas. Inténtalo dentro de un rato' })

/* Exportamos los middlewares para el router y para index.js */
module.exports = {
    notFound,
    errorHandler,
    verificarToken,
    limiteGeneral,
    limiteAdmin,
    limiteRecomendaciones
}
