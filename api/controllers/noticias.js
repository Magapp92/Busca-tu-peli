
/* Controlador de noticias: listado para la portada y la página de noticias, noticia completa
y alta, edición y borrado desde el panel; todas las respuestas siguen la forma { message, data } */
const { Noticia } = require('../models')

/* Listado sin el cuerpo: el texto completo y el ranking se piden al abrir la noticia */
const getNoticias = async (req, res, next) => {
    try {
        /* Recogemos el límite de la URL (la portada pide solo las 3 últimas) */
        const { limite } = req.query

        let consulta = Noticia.find({}, { parrafos: 0, lista: 0, ranking: 0 }).sort({ fecha: -1 })
        /* Límite entre 1 y 50; si no es un número se ignora */
        const n = Math.trunc(Number(limite))
        if (n > 0) consulta = consulta.limit(Math.min(n, 50))

        const data = await consulta

        res.status(200).json({
            message: `Mostrando ${data.length} noticias`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Noticia completa por su _id: la pide noticias.html al abrirla en el modal */
const getNoticiaById = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Noticia.findById(_id)
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la noticia con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Mostrando la noticia con id ${_id}`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Crea una noticia con los datos del formulario del panel */
const postNoticia = async (req, res, next) => {
    try {
        const { body } = req

        const data = await Noticia.create(body)

        res.status(201).json({
            message: 'Noticia creada correctamente',
            data
        })
    } catch (error) {
        next(error)
    }
}

/* PUT reemplaza la noticia completa con lo que llega del formulario del panel */
const putNoticia = async (req, res, next) => {
    try {
        /* Recogemos el id de la URL y los datos nuevos del formulario */
        const { _id } = req.params
        const { body } = req

        const data = await Noticia.findOneAndReplace({ _id }, body, {
            returnDocument: 'after',
            runValidators: true
        })
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la noticia con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Noticia ${_id} actualizada correctamente`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* PATCH modifica solo los campos que llegan */
const patchNoticia = async (req, res, next) => {
    try {
        const { _id } = req.params
        const { body } = req

        const data = await Noticia.findByIdAndUpdate(_id, { $set: body }, {
            returnDocument: 'after',
            runValidators: true
        })
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la noticia con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Noticia ${_id} modificada correctamente`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Borra la noticia */
const deleteNoticia = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Noticia.findByIdAndDelete(_id)
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la noticia con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Noticia ${_id} eliminada correctamente`,
            data
        })
    } catch (error) {
        next(error)
    }
}


/* Exportamos los controllers para el router */
module.exports = {
getNoticias,
getNoticiaById,
postNoticia,
putNoticia,
patchNoticia,
deleteNoticia
}
