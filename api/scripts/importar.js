
/* Importación masiva desde TMDB (npm run importar):
las 30 películas más populares de cada plataforma en España.
Las nuevas se crean; las que ya estaban solo actualizan sus plataformas. Se puede repetir sin duplicar */
require('dotenv').config()
const mongoose = require('mongoose')
const { Pelicula } = require('../models')
const { descubrir, obtenerPelicula, existente } = require('../services/tmdb')

const CLAVES = ['netflix', 'prime', 'disney', 'max', 'appletv']
const POR_PLATAFORMA = Number(process.argv[2]) || 30

const importar = async () => {
    const resumen = { nuevas: 0, actualizadas: 0, errores: 0 }
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })

        const ids = new Set()
        for (const clave of CLAVES) {
            const encontrados = await descubrir(clave, POR_PLATAFORMA)
            encontrados.forEach((id) => ids.add(id))
            console.log(`📺 ${clave}: ${encontrados.length} películas`)
        }
        console.log(`🔎 ${ids.size} películas distintas, descargando fichas…`)

        for (const id of ids) {
            try {
                const peli = await obtenerPelicula(id)
                const ya = await existente(peli)
                if (ya) {
                    await Pelicula.updateOne({ _id: ya._id }, { $set: { plataformas: peli.plataformas, tmdbId: peli.tmdbId } })
                    resumen.actualizadas++
                } else {
                    await Pelicula.create(peli)
                    resumen.nuevas++
                    console.log(`  + ${peli.titulo} (${peli.anio ?? 's/f'})`)
                }
            } catch (error) {
                resumen.errores++
                console.log(`  ✗ TMDB ${id}: ${error.message}`)
            }
        }

        console.log(`✅ ${resumen.nuevas} nuevas · ${resumen.actualizadas} actualizadas · ${resumen.errores} con error`)
    } catch (error) {
        console.log(`Error en la importación: ${error.message}`)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

importar()
