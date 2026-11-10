
/* Genera las noticias de datos (populares de la semana y mejor valoradas por plataforma).
Uso: npm run noticias            → base local (MONGO_URI)
        npm run noticias -- --atlas → Atlas (MONGO_URI_ATLAS), la de buscatupeli.com
En producción lo hace solo cada lunes la función programada de Netlify (functions/noticias-semanales.js) */
require('dotenv').config({ quiet: true })
const mongoose = require('mongoose')
const { generarNoticias } = require('../services/noticias')

const uri = process.argv.includes('--atlas') ? process.env.MONGO_URI_ATLAS : process.env.MONGO_URI

const ejecutar = async () => {
    try {
        await mongoose.connect(uri, { dbName: 'buscatupeli', serverSelectionTimeoutMS: 10000 })
        const { valoraciones, importadas, plataformas, noticias } = await generarNoticias()
        console.log(`📺 Estrenos que ya han llegado a una plataforma: ${plataformas.actualizadas} de ${plataformas.pendientes}`)
        console.log(`🔗 Películas enlazadas con TMDB: ${valoraciones.enlazadas}`)
        console.log(`🎬 Películas en tendencia añadidas al catálogo: ${importadas}`)
        console.log(`⭐ Valoraciones actualizadas: ${valoraciones.actualizadas} de ${valoraciones.total}`)
        noticias.forEach((n) => console.log(`📰 ${n}`))
    } catch (error) {
        console.log(`Error generando noticias: ${error.message}`)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

ejecutar()
