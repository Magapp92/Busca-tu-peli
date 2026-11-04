/* App de Express compartida: la usan el servidor local (index.js) y la función de Netlify (functions/api.js) */
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')
const { router } = require('./routes/router')
const { notFound, errorHandler } = require('./middlewares')

/* Conexión reutilizable: en Netlify la misma instancia atiende varias peticiones seguidas;
   si falla se vuelve a intentar en la siguiente */
let conexion = null

const conectar = () => {
    if (!conexion) {
        conexion = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
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

    app.use(cors())
    /* Helmet sin CSP para que el front pueda incrustar los trailers de YouTube */
    app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
    app.use(morgan('dev'))
    app.use(express.json())
    app.use(express.urlencoded({ extended: false }))

    if (staticDir) app.use(express.static(staticDir))

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
