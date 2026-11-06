
/* Controlador de películas: listados y filtros para el catálogo y la portada, ficha y relacionadas,
y alta, edición y borrado desde el panel; todas las respuestas siguen la forma { message, data } */
const { Pelicula } = require('../models')

/* Regex que ignora mayúsculas y tildes: 'accion' encuentra 'Acción' */
const regexFlexible = ( texto ) => {
    const tildes = { a: '[aá]', e: '[eé]', i: '[ií]', o: '[oó]', u: '[uúü]', n: '[nñ]' }
    const escapado = texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patron = escapado
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[aeioun]/gi, ( letra ) => tildes[letra.toLowerCase()])
    return new RegExp(patron, 'i')
}

/* Órdenes que entiende el catálogo */
const ORDENES = {
    recientes: { anio: -1, titulo: 1 },
    antiguas: { anio: 1, titulo: 1 },
    titulo: { titulo: 1 },
    duracion: { duracionMin: -1 }
}

/* Un parámetro de la URL como texto: si llega repetido (?genero=a&genero=b) nos quedamos con el primero */
const texto = ( valor, max = 100 ) => (Array.isArray(valor) ? valor[0] : valor)?.toString().trim().slice(0, max) || ''

/* Listado con filtros combinables por query para el catálogo: ?q=&genero=&plataforma=&anio=&destacada=&orden=&limite= */
const getPeliculas = async (req, res, next) => {
    try {
        /* Recogemos los filtros de la URL, todos como texto y con un largo máximo */
        const q = texto(req.query.q)
        const genero = texto(req.query.genero, 40)
        const plataforma = texto(req.query.plataforma, 20)
        const orden = texto(req.query.orden, 20) || 'titulo'
        const { anio, destacada, limite } = req.query
        const filtro = {}

        /* La búsqueda mira el título, el título original, el reparto y la dirección */
        if (q) {
            const re = regexFlexible(q)
            filtro.$or = [{ titulo: re }, { tituloOriginal: re }, { reparto: re }, { direccion: re }]
        }
        if (genero) filtro.generos = genero
        if (plataforma) filtro['plataformas.clave'] = plataforma
        if (anio && Number.isInteger(Number(anio))) filtro.anio = Number(anio)
        if (destacada !== undefined) filtro.destacada = destacada === 'true'

        let consulta = Pelicula.find(filtro).sort(ORDENES[orden] || ORDENES.titulo)
        /* Límite entre 1 y 200; si no es un número se ignora */
        const n = Math.trunc(Number(limite))
        if (n > 0) consulta = consulta.limit(Math.min(n, 200))

        const data = await consulta

        res.status(200).json({
            message: `Mostrando ${data.length} películas`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Géneros distintos que existen en la colección, para los filtros del catálogo */
const getGeneros = async (req, res, next) => {
    try {
        /* Pedimos a Mongo los géneros sin repetir y los ordenamos alfabéticamente en español */
        const data = (await Pelicula.distinct('generos')).sort(( a, b ) => a.localeCompare(b, 'es'))

        res.status(200).json({
            message: 'Mostrando géneros',
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Buscamos las películas del género que llega en la URL (la collation ignora mayúsculas y tildes) */
const getPeliculasByGenero = async (req, res, next) => {
    try {
        /* Recogemos el género de la URL */
        const { genero } = req.params

        const data = await Pelicula.find({ generos: genero }).sort(ORDENES.titulo)

        res.status(200).json({
            message: `Mostrando las películas de ${genero}`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Buscamos las películas disponibles en la plataforma que llega en la URL (netflix, prime, disney, max, appletv) */
const getPeliculasByPlataforma = async (req, res, next) => {
    try {
        /* Recogemos la plataforma de la URL */
        const { plataforma } = req.params

        const data = await Pelicula.find({ 'plataformas.clave': plataforma }).sort(ORDENES.titulo)

        res.status(200).json({
            message: `Mostrando las películas de ${plataforma}`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Ficha de una película: la pide pelicula.html al pulsar un póster */
const getPeliculaById = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Pelicula.findById(_id)
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la película con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Mostrando la película con id ${_id}`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Películas que comparten algún género, para el bloque "También te puede gustar" */
const getRelacionadas = async (req, res, next) => {
    try {
        const { _id } = req.params

        /* Solo necesitamos los géneros de la película para buscar las parecidas */
        const pelicula = await Pelicula.findById(_id, { generos: 1 })
        /* 404 si el id no existe */
        if (!pelicula) {
            return res.status(404).json({
                message: `No existe la película con id ${_id}`,
                data: null
            })
        }

        const data = await Pelicula
            .find({ _id: { $ne: _id }, generos: { $in: pelicula.generos } })
            .limit(10)

        res.status(200).json({
            message: `Películas relacionadas con ${_id}`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Crea una película con los datos del formulario del panel */
const postPelicula = async (req, res, next) => {
    try {
        const { body } = req

        const data = await Pelicula.create(body)

        res.status(201).json({
            message: 'Película creada correctamente',
            data
        })
    } catch (error) {
        next(error)
    }
}

/* PUT reemplaza el documento completo con lo que llega del formulario del panel */
const putPelicula = async (req, res, next) => {
    try {
        /* Recogemos el id de la URL y los datos nuevos del formulario */
        const { _id } = req.params
        const { body } = req

        const data = await Pelicula.findOneAndReplace({ _id }, body, {
            returnDocument: 'after',
            runValidators: true
        })
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la película con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Película ${_id} actualizada correctamente`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* PATCH modifica solo los campos que llegan (p. ej. destacada desde el interruptor del panel) */
const patchPelicula = async (req, res, next) => {
    try {
        const { _id } = req.params
        const { body } = req

        const data = await Pelicula.findByIdAndUpdate(_id, { $set: body }, {
            returnDocument: 'after',
            runValidators: true
        })
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la película con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Película ${_id} modificada correctamente`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Borra la película del catálogo */
const deletePelicula = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Pelicula.findByIdAndDelete(_id)
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la película con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Película ${_id} eliminada correctamente`,
            data
        })
    } catch (error) {
        next(error)
    }
}


/* Exportamos los controllers para el router */
module.exports = {
getPeliculas,
getGeneros,
getPeliculasByGenero,
getPeliculasByPlataforma,
getPeliculaById,
getRelacionadas,
postPelicula,
putPelicula,
patchPelicula,
deletePelicula
}
