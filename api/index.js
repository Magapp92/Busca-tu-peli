
/* Si arrancamos el servidor a mano (npm run dev) limpiamos la consola; en Netlify este archivo solo se importa */
const enLocal = require.main === module
if (enLocal) console.clear()
console.log(`Iniciando busca tu peli api 🎬`)

/* Cargamos lo que necesita la API: express para el servidor, cors para que la web pueda llamarla,
helmet y morgan para seguridad y registro de peticiones, y mongoose para hablar con Mongo */
const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')
const { router } = require('./routes/router')
const { notFound, errorHandler, limiteGeneral } = require('./middlewares')

/* Leemos el puerto y la cadena de conexión del archivo .env */
require('dotenv').config({ quiet: true })
const { PORT = 3100, MONGO_URI } = process.env

/* Orígenes que pueden llamar a la API desde el navegador: la web y los servidores de desarrollo */
const ORIGENES = [
    'https://buscatupeli.com',
    'https://www.buscatupeli.com',
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
]

/* Política de seguridad de contenidos: solo se cargan recursos de la propia web y de los servicios que usa
(imágenes de TMDB y miniaturas y vídeos de YouTube; las fuentes se sirven desde la propia web). La misma que netlify.toml para las páginas */
const CSP = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'"],
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

/* En Netlify cada petición puede caer en una copia nueva de la función, así que la conexión
se pide antes de entrar al router: si ya existe se reutiliza y si falló se vuelve a intentar.
Con 5 segundos de espera un Atlas dormido responde error rápido en vez de colgar la petición.
dbName fijo: aunque la cadena de Atlas no lleve /buscatupeli, no se usa la base "test" */
let conexion = null

const conectar = () => {
    if (!conexion) {
        conexion = mongoose.connect(MONGO_URI, { dbName: 'buscatupeli', serverSelectionTimeoutMS: 5000 })
            .catch(( error ) => {
                conexion = null
                throw error
            })
    }
    return conexion
}

/* Creamos la aplicación de Express */
const app = express()

/* Solo la web y los servidores de desarrollo pueden llamar a la API desde el navegador */
app.use( cors({ origin: ORIGENES }) )
/* Helmet añade cabeceras de seguridad (sin COEP para poder incrustar los tráileres de YouTube) y morgan loguea cada petición */
app.use( helmet({
    contentSecurityPolicy: { useDefaults: false, directives: CSP },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}) )
app.use( morgan('dev') )
/* Cuerpos de petición pequeños: ningún formulario necesita más de 100 kB */
app.use( express.json({ limit: '100kb' }) )
app.use( express.urlencoded({ extended: false, limit: '100kb' }) )

/* En local la API también sirve el front (http://localhost:3100); en Netlify lo sirve su CDN */
if (enLocal) app.use( express.static(path.join(__dirname, '..', 'frontend')) )

/* Límite general de peticiones por IP */
app.use( '/buscatupeli', limiteGeneral )

/* Sin base de datos no entramos al router: respondemos 503 con un mensaje claro */
app.use( '/buscatupeli', async ( req, res, next ) => {
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

/* Todas las rutas de la API cuelgan de /buscatupeli */
app.use( '/buscatupeli', router )

/* Middlewares de error globales */
app.use( notFound )
app.use( errorHandler )

/* Arrancamos el servidor solo en local; en Netlify la función functions/api.js importa la app y la ejecuta.
En Express 5 el error de arranque (p. ej. puerto ocupado) llega al callback */
if (enLocal) {
    /* Al arrancar intentamos conectar una primera vez y avisamos por consola de cómo ha ido */
    conectar()
        .then(() => console.log(`Conectado a Mongo 🔗`))
        .catch(( error ) => console.log(`Sin conexión a Mongo: ${error.message}`))

    app.listen( PORT, ( error ) => {
        if (error) {
            console.log(`❌ No se pudo arrancar en el puerto ${PORT}: ${error.code === 'EADDRINUSE' ? 'puerto ocupado, cambia PORT en .env' : error.message}`)
            process.exit(1)
        }
        console.log(`✅Iniciando API en localhost:${PORT}/buscatupeli · Web en localhost:${PORT}`)
    })
}

/* Exportamos la app para la función de Netlify y la conexión para la función semanal de noticias */
module.exports = {
    app,
    conectar
}
