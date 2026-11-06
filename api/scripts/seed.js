
/* Carga inicial: vacía películas y noticias y las rellena con _data/*.json (npm run seed) */
require('dotenv').config()
const mongoose = require('mongoose')
const { Pelicula, Noticia } = require('../models')
const peliculas = require('../_data/peliculas.json')
const noticias = require('../_data/noticias.json')

const sembrar = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })

        await Pelicula.deleteMany({})
        await Noticia.deleteMany({})
        const p = await Pelicula.insertMany(peliculas)
        const n = await Noticia.insertMany(noticias)

        console.log(`🌱 ${p.length} películas y ${n.length} noticias cargadas`)
    } catch (error) {
        console.log(`Error en el seed: ${error.message}`)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

sembrar()
