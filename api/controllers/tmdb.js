/* Importación desde TMDB para el panel admin: buscar e importar películas sueltas */
const { Pelicula } = require('../models')
const { buscar, obtenerPelicula, existente } = require('../services/tmdb')

/* Resultados de TMDB marcando cuáles ya están en el catálogo */
const getBuscarTmdb = async (req, res, next) => {
    try {
        const q = (req.query.q || '').trim()
        if (q.length < 2) return res.status(400).json({ message: 'Escribe al menos 2 letras', data: null })

        const resultados = await buscar(q)
        const yaEstan = await Pelicula.find({ tmdbId: { $in: resultados.map((r) => r.tmdbId) } }, { tmdbId: 1 })
        const ids = new Set(yaEstan.map((p) => p.tmdbId))

        res.status(200).json({
            message: `${resultados.length} resultados en TMDB`,
            data: resultados.map((r) => ({ ...r, enCatalogo: ids.has(r.tmdbId) }))
        })
    } catch (error) {
        next(error)
    }
}

const postImportarTmdb = async (req, res, next) => {
    try {
        const tmdbId = Number(req.params.tmdbId)
        if (!Number.isInteger(tmdbId) || tmdbId <= 0) return res.status(400).json({ message: 'Id de TMDB no válido', data: null })

        const pelicula = await obtenerPelicula(tmdbId)
        const repetida = await existente(pelicula)
        if (repetida) {
            return res.status(409).json({
                message: `“${repetida.titulo}” ya está en el catálogo`,
                data: repetida
            })
        }

        const data = await Pelicula.create(pelicula)

        res.status(201).json({
            message: `“${data.titulo}” importada desde TMDB`,
            data
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getBuscarTmdb,
    postImportarTmdb
}
