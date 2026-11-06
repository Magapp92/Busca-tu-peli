const { Pelicula } = require('../models')

/* Regex que ignora mayúsculas y tildes: 'accion' encuentra 'Acción' */
const regexFlexible = (texto) => {
    const tildes = { a: '[aá]', e: '[eé]', i: '[ií]', o: '[oó]', u: '[uúü]', n: '[nñ]' }
    const escapado = texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const patron = escapado
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[aeioun]/gi, (l) => tildes[l.toLowerCase()])
    return new RegExp(patron, 'i')
}

const ORDENES = {
    recientes: { anio: -1, titulo: 1 },
    antiguas: { anio: 1, titulo: 1 },
    titulo: { titulo: 1 },
    duracion: { duracionMin: -1 }
}

/* Un parámetro de la URL como texto: si llega repetido (?genero=a&genero=b) nos quedamos con el primero */
const texto = (v, max = 100) => (Array.isArray(v) ? v[0] : v)?.toString().trim().slice(0, max) || ''

/* Listado con filtros opcionales por query: ?q=&genero=&plataforma=&anio=&destacada=&orden=&limite= */
const getPeliculas = async (req, res, next) => {
    try {
        const q = texto(req.query.q)
        const genero = texto(req.query.genero, 40)
        const plataforma = texto(req.query.plataforma, 20)
        const orden = texto(req.query.orden, 20) || 'titulo'
        const { anio, destacada, limite } = req.query
        const filtro = {}

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

/* Géneros distintos que existen en la colección, para los filtros del front */
const getGeneros = async (req, res, next) => {
    try {
        const data = (await Pelicula.distinct('generos')).sort((a, b) => a.localeCompare(b, 'es'))

        res.status(200).json({
            message: 'Mostrando géneros',
            data
        })
    } catch (error) {
        next(error)
    }
}

const getPeliculaById = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Pelicula.findById(_id)
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

        const pelicula = await Pelicula.findById(_id, { generos: 1 })
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

const postPelicula = async (req, res, next) => {
    try {
        const data = await Pelicula.create(req.body)

        res.status(201).json({
            message: 'Película creada correctamente',
            data
        })
    } catch (error) {
        next(error)
    }
}

/* PUT reemplaza el documento completo */
const putPelicula = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Pelicula.findOneAndReplace({ _id }, req.body, {
            returnDocument: 'after',
            runValidators: true
        })
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

/* PATCH modifica solo los campos que llegan */
const patchPelicula = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Pelicula.findByIdAndUpdate(_id, { $set: req.body }, {
            returnDocument: 'after',
            runValidators: true
        })
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

const deletePelicula = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Pelicula.findByIdAndDelete(_id)
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

module.exports = {
    getPeliculas,
    getGeneros,
    getPeliculaById,
    getRelacionadas,
    postPelicula,
    putPelicula,
    patchPelicula,
    deletePelicula
}
