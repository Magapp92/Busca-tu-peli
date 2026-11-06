
/* Controlador de la importación desde TMDB para el panel: buscar películas e importarlas al catálogo.
La conversión de los datos de TMDB a nuestro schema está en services/tmdb.js */
const { Pelicula } = require('../models')
const { buscar, obtenerPelicula, existente } = require('../services/tmdb')

/* Resultados de TMDB marcando cuáles ya están en el catálogo */
const getBuscarTmdb = async (req, res, next) => {
    try {
        /* Recogemos el texto a buscar de la URL: al menos 2 letras */
        const q = (req.query.q || '').toString().trim().slice(0, 100)
        if (q.length < 2) {
            return res.status(400).json({
                message: 'Escribe al menos 2 letras',
                data: null
            })
        }

        const resultados = await buscar(q)
        /* Marcamos las que ya tenemos para que el panel no deje importarlas otra vez */
        const yaEstan = await Pelicula.find({ tmdbId: { $in: resultados.map(( r ) => r.tmdbId) } }, { tmdbId: 1 })
        const ids = new Set(yaEstan.map(( p ) => p.tmdbId))

        res.status(200).json({
            message: `${resultados.length} resultados en TMDB`,
            data: resultados.map(( r ) => ({ ...r, enCatalogo: ids.has(r.tmdbId) }))
        })
    } catch (error) {
        next(error)
    }
}

/* Importa una película de TMDB por su id con su ficha completa y sus plataformas en España */
const postImportarTmdb = async (req, res, next) => {
    try {
        /* Recogemos el id de TMDB de la URL: tiene que ser un número entero positivo */
        const tmdbId = Number(req.params.tmdbId)
        if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
            return res.status(400).json({
                message: 'Id de TMDB no válido',
                data: null
            })
        }

        const pelicula = await obtenerPelicula(tmdbId)
        /* 409 si ya está en el catálogo */
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


/* Exportamos los controllers para el router */
module.exports = {
getBuscarTmdb,
postImportarTmdb
}
