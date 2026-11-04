const express = require('express')
const { notFound, errorHandler } = require('../middlewares')
const { getPeliculas, getGeneros, getPeliculaById, getRelacionadas, postPelicula,
    putPelicula, patchPelicula, deletePelicula } = require('../controllers/peliculas')
const { getNoticias, getNoticiaById, postNoticia, putNoticia, patchNoticia,
    deleteNoticia } = require('../controllers/noticias')
const { getRecomendaciones, getRecomendacionById, postRecomendacion, patchRecomendacion,
    deleteRecomendacion } = require('../controllers/recomendaciones')

const { getBuscarTmdb, postImportarTmdb } = require('../controllers/tmdb')

const router = express.Router()

/* Películas: /generos va antes que /:_id para que no se lea como un id */
router.route('/peliculas')
    .get(getPeliculas)
    .post(postPelicula)

router.route('/peliculas/generos')
    .get(getGeneros)

router.route('/peliculas/:_id')
    .get(getPeliculaById)
    .put(putPelicula)
    .patch(patchPelicula)
    .delete(deletePelicula)

router.route('/peliculas/:_id/relacionadas')
    .get(getRelacionadas)

/* Noticias */
router.route('/noticias')
    .get(getNoticias)
    .post(postNoticia)

router.route('/noticias/:_id')
    .get(getNoticiaById)
    .put(putNoticia)
    .patch(patchNoticia)
    .delete(deleteNoticia)

/* Recomendaciones del formulario "¿Qué peli echaste en falta?" */
router.route('/recomendaciones')
    .get(getRecomendaciones)
    .post(postRecomendacion)

router.route('/recomendaciones/:_id')
    .get(getRecomendacionById)
    .patch(patchRecomendacion)
    .delete(deleteRecomendacion)

/* Importación desde TMDB (panel admin) */
router.route('/tmdb/buscar')
    .get(getBuscarTmdb)

router.route('/tmdb/importar/:tmdbId')
    .post(postImportarTmdb)

router.use(notFound)
router.use(errorHandler)

module.exports = {
    router
}
