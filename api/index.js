console.clear()
console.log('Iniciando Busca tu peli API 🎬')

const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')
const { router } = require('./routes/router')
const { notFound, errorHandler } = require('./middlewares')

require('dotenv').config()
const { PORT = 3100, MONGO_URI } = process.env

/* Conexión reutilizable: si falla se vuelve a intentar en la siguiente petición */
let conexion = null

const conectar = () => {
    if (!conexion) {
        conexion = mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
            .catch((error) => {
                conexion = null
                throw error
            })
    }
    return conexion
}

const app = express()

app.use(cors())
/* Helmet sin CSP para que el front servido desde aquí pueda incrustar los trailers de YouTube */
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

/* El front (HTML/CSS/JS) se sirve desde la misma API: http://localhost:PORT */
app.use(express.static(path.join(__dirname, '..', 'frontend')))

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

conectar()
    .then(() => console.log('Conectado a Mongo 🔗'))
    .catch((error) => console.log(`Sin conexión a Mongo: ${error.message}`))

/* En Express 5 el error de arranque (p. ej. puerto ocupado) llega al callback */
app.listen(PORT, (error) => {
    if (error) {
        console.log(`❌ No se pudo arrancar en el puerto ${PORT}: ${error.code === 'EADDRINUSE' ? 'puerto ocupado, cambia PORT en .env' : error.message}`)
        process.exit(1)
    }
    console.log(`✅ API en http://localhost:${PORT}/buscatupeli  ·  Web en http://localhost:${PORT}`)
})

module.exports = app
