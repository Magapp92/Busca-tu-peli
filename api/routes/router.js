const express = require('express')
const { notFound, errorHandler, requireAdmin, limiteAdmin, limiteRecomendaciones } = require('../middlewares')
const { getPeliculas, getGeneros, getPeliculaById, getRelacionadas, postPelicula,
    putPelicula, patchPelicula, deletePelicula } = require('../controllers/peliculas')
const { getNoticias, getNoticiaById, postNoticia, putNoticia, patchNoticia,
    deleteNoticia } = require('../controllers/noticias')
const { getRecomendaciones, getRecomendacionById, postRecomendacion, patchRecomendacion,
    deleteRecomendacion } = require('../controllers/recomendaciones')
const { getBuscarTmdb, postImportarTmdb } = require('../controllers/tmdb')

const router = express.Router()

/* Rutas de admin: primero el límite de intentos fallidos y después la clave */
const admin = [limiteAdmin, requireAdmin]

/* Lectura pública; crear, editar y borrar exigen la clave de admin (requireAdmin) */

/* Películas: /generos va antes que /:_id para que no se lea como un id */
router.route('/peliculas')
    .get(getPeliculas)
    .post(...admin, postPelicula)

router.route('/peliculas/generos')
    .get(getGeneros)

router.route('/peliculas/:_id')
    .get(getPeliculaById)
    .put(...admin, putPelicula)
    .patch(...admin, patchPelicula)
    .delete(...admin, deletePelicula)

router.route('/peliculas/:_id/relacionadas')
    .get(getRelacionadas)

/* Noticias */
router.route('/noticias')
    .get(getNoticias)
    .post(...admin, postNoticia)

router.route('/noticias/:_id')
    .get(getNoticiaById)
    .put(...admin, putNoticia)
    .patch(...admin, patchNoticia)
    .delete(...admin, deleteNoticia)

/* Recomendaciones: el formulario público solo crea; leerlas (llevan emails) es de admin */
router.route('/recomendaciones')
    .get(...admin, getRecomendaciones)
    .post(limiteRecomendaciones, postRecomendacion)

router.route('/recomendaciones/:_id')
    .get(...admin, getRecomendacionById)
    .patch(...admin, patchRecomendacion)
    .delete(...admin, deleteRecomendacion)

/* Importación desde TMDB (panel admin) */
router.route('/tmdb/buscar')
    .get(...admin, getBuscarTmdb)

router.route('/tmdb/importar/:tmdbId')
    .post(...admin, postImportarTmdb)

/* El admin comprueba aquí la clave antes de mostrar el panel */
router.route('/admin/verificar')
    .get(...admin, (req, res) => res.status(200).json({ message: 'Clave correcta', data: true }))

router.use(notFound)
router.use(errorHandler)

module.exports = {
    router
}
