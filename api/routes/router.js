const express = require('express')
const { notFound, errorHandler, requireAdmin } = require('../middlewares')
const { getPeliculas, getGeneros, getPeliculaById, getRelacionadas, postPelicula,
    putPelicula, patchPelicula, deletePelicula } = require('../controllers/peliculas')
const { getNoticias, getNoticiaById, postNoticia, putNoticia, patchNoticia,
    deleteNoticia } = require('../controllers/noticias')
const { getRecomendaciones, getRecomendacionById, postRecomendacion, patchRecomendacion,
    deleteRecomendacion } = require('../controllers/recomendaciones')
const { getBuscarTmdb, postImportarTmdb } = require('../controllers/tmdb')

const router = express.Router()

/* Lectura pública; crear, editar y borrar exigen la clave de admin (requireAdmin) */

/* Películas: /generos va antes que /:_id para que no se lea como un id */
router.route('/peliculas')
    .get(getPeliculas)
    .post(requireAdmin, postPelicula)

router.route('/peliculas/generos')
    .get(getGeneros)

router.route('/peliculas/:_id')
    .get(getPeliculaById)
    .put(requireAdmin, putPelicula)
    .patch(requireAdmin, patchPelicula)
    .delete(requireAdmin, deletePelicula)

router.route('/peliculas/:_id/relacionadas')
    .get(getRelacionadas)

/* Noticias */
router.route('/noticias')
    .get(getNoticias)
    .post(requireAdmin, postNoticia)

router.route('/noticias/:_id')
    .get(getNoticiaById)
    .put(requireAdmin, putNoticia)
    .patch(requireAdmin, patchNoticia)
    .delete(requireAdmin, deleteNoticia)

/* Recomendaciones: el formulario público solo crea; leerlas (llevan emails) es de admin */
router.route('/recomendaciones')
    .get(requireAdmin, getRecomendaciones)
    .post(postRecomendacion)

router.route('/recomendaciones/:_id')
    .get(requireAdmin, getRecomendacionById)
    .patch(requireAdmin, patchRecomendacion)
    .delete(requireAdmin, deleteRecomendacion)

/* Importación desde TMDB (panel admin) */
router.route('/tmdb/buscar')
    .get(requireAdmin, getBuscarTmdb)

router.route('/tmdb/importar/:tmdbId')
    .post(requireAdmin, postImportarTmdb)

/* El admin comprueba aquí la clave antes de mostrar el panel */
router.route('/admin/verificar')
    .get(requireAdmin, (req, res) => res.status(200).json({ message: 'Clave correcta', data: true }))

router.use(notFound)
router.use(errorHandler)

module.exports = {
    router
}
