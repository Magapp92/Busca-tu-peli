
/* Importamos los controllers de cada recurso y los middlewares de error, de token y de límites */
const express = require('express')
const { notFound, errorHandler, verificarToken, limiteAdmin, limiteRecomendaciones } = require('../middlewares')
const { postLogin } = require('../controllers/login')
const { getPeliculas, getGeneros, getPeliculaById, getPeliculasByGenero, getPeliculasByPlataforma,
    getRelacionadas, postPelicula, putPelicula, patchPelicula, deletePelicula } = require('../controllers/peliculas')
const { getNoticias, getNoticiaById, postNoticia, putNoticia, patchNoticia,
    deleteNoticia } = require('../controllers/noticias')
const { getRecomendaciones, getRecomendacionById, postRecomendacion, patchRecomendacion,
    deleteRecomendacion } = require('../controllers/recomendaciones')
const { getBuscarTmdb, postImportarTmdb } = require('../controllers/tmdb')
/* Creamos el router que index.js monta en /buscatupeli */
const router = express.Router()

/* Rutas agrupadas por recurso con .route() para encadenar los verbos de cada endpoint */
/* Autenticación: el login del panel devuelve el token que exigen las escrituras.
Lleva el límite de intentos fallidos contra la fuerza bruta de la clave */
router.route('/login')
.post( limiteAdmin, postLogin )

/* El panel comprueba aquí que el token guardado sigue siendo válido antes de mostrarse */
router.route('/admin/verificar')
.get( verificarToken, ( req, res ) => res.status(200).json({ message: 'Sesión válida', data: true }) )

/* Películas: lectura pública (con filtros combinables por query para el catálogo); crear, editar y borrar exigen token */
router.route('/peliculas')
.get( getPeliculas )
.post( verificarToken, postPelicula )

/* /generos va antes que /:_id para que no se lea como un id */
router.route('/peliculas/generos')
.get( getGeneros )

/* Filtros sueltos: por género y por plataforma */
router.route('/peliculas/genero/:genero')
.get( getPeliculasByGenero )

router.route('/peliculas/plataforma/:plataforma')
.get( getPeliculasByPlataforma )

router.route('/peliculas/:_id')
.get( getPeliculaById )
.put( verificarToken, putPelicula )
.patch( verificarToken, patchPelicula )
.delete( verificarToken, deletePelicula )

/* Películas que comparten género, para "También te puede gustar" */
router.route('/peliculas/:_id/relacionadas')
.get( getRelacionadas )

/* Noticias: lectura pública; cualquier cambio exige token */
router.route('/noticias')
.get( getNoticias )
.post( verificarToken, postNoticia )

router.route('/noticias/:_id')
.get( getNoticiaById )
.put( verificarToken, putNoticia )
.patch( verificarToken, patchNoticia )
.delete( verificarToken, deleteNoticia )

/* Recomendaciones: el formulario público solo crea (con límite de envíos); leerlas (llevan emails) exige token */
router.route('/recomendaciones')
.get( verificarToken, getRecomendaciones )
.post( limiteRecomendaciones, postRecomendacion )

router.route('/recomendaciones/:_id')
.get( verificarToken, getRecomendacionById )
.patch( verificarToken, patchRecomendacion )
.delete( verificarToken, deleteRecomendacion )

/* Importación desde TMDB para el panel: buscar e importar exigen token */
router.route('/tmdb/buscar')
.get( verificarToken, getBuscarTmdb )

router.route('/tmdb/importar/:tmdbId')
.post( verificarToken, postImportarTmdb )

/* Los middlewares de error van al final: notFound atrapa rutas no definidas
y errorHandler responde a los next(error) de los controllers */
router.use( notFound )
router.use( errorHandler )

/* Exportamos el router para index.js */
module.exports = {
    router
}
