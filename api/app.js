/* App de Express compartida: la usan el servidor local (index.js) y la función de Netlify (functions/api.js) */
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')
const { router } = require('./routes/router')
const { notFound, errorHandler, limiteGeneral } = require('./middlewares')

/* Orígenes que pueden llamar a la API desde el navegador: la web y los servidores de desarrollo */
const ORIGENES = [
    'https://buscatupeli.com',
    'https://www.buscatupeli.com',
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
]

/* Política de seguridad de contenidos: solo se cargan recursos de la propia web y de los servicios que usa
   (fuentes de Google, imágenes de TMDB y miniaturas y vídeos de YouTube). La misma que netlify.toml para las páginas */
const CSP = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https://image.tmdb.org', 'https://i.ytimg.com'],
    frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    /* En local se sirve por http: no forzamos https (en producción lo pone netlify.toml) */
    upgradeInsecureRequests: null
}

/* Conexión reutilizable: en Netlify la misma instancia atiende varias peticiones seguidas;
   si falla se vuelve a intentar en la siguiente */
let conexion = null

const conectar = () => {
    if (!conexion) {
        /* dbName fijo: aunque la cadena de Atlas no lleve /buscatupeli, no se usa la base "test" */
        conexion = mongoose.connect(process.env.MONGO_URI, { dbName: 'buscatupeli', serverSelectionTimeoutMS: 5000 })
            .catch((error) => {
                conexion = null
                throw error
            })
    }
    return conexion
}

/* staticDir: carpeta del front que sirve el servidor local (en Netlify lo sirve su CDN) */
const crearApp = ({ staticDir } = {}) => {
    const app = express()

    app.use(cors({ origin: ORIGENES }))
    /* Cabeceras de seguridad; sin COEP para poder incrustar los tráileres de YouTube */
    app.use(helmet({
        contentSecurityPolicy: { useDefaults: false, directives: CSP },
        crossOriginEmbedderPolicy: false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }))
    app.use(morgan('dev'))
    /* Cuerpos de petición pequeños: ningún formulario necesita más de 100 kB */
    app.use(express.json({ limit: '100kb' }))
    app.use(express.urlencoded({ extended: false, limit: '100kb' }))

    if (staticDir) app.use(express.static(staticDir))

    app.use('/buscatupeli', limiteGeneral)

    /* Sin base de datos no entramos al router: 503 con mensaje claro */
    app.use('/buscatupeli', async (req, res, next) => {
        try {
            await conectar()
            next()
        } catch (error) {
            console.log(`Sin conexión a Mongo: ${error.message}`)
            res.status(503).json({
                message: 'Base de datos no disponible, inténtalo en unos segundos',
                data: null
            })
        }
    })

    app.use('/buscatupeli', router)

    app.use(notFound)
    app.use(errorHandler)

    return app
}

module.exports = {
    crearApp,
    conectar
}
