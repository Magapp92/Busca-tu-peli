const { Noticia } = require('../models')

/* Listado sin el cuerpo: el texto completo se pide al abrir la noticia */
const getNoticias = async (req, res, next) => {
    try {
        const { limite } = req.query

        let consulta = Noticia.find({}, { parrafos: 0, lista: 0 }).sort({ fecha: -1 })
        if (limite) consulta = consulta.limit(Number(limite))

        const data = await consulta

        res.status(200).json({
            message: `Mostrando ${data.length} noticias`,
            data
        })
    } catch (error) {
        next(error)
    }
}

const getNoticiaById = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Noticia.findById(_id)
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

const postNoticia = async (req, res, next) => {
    try {
        const data = await Noticia.create(req.body)

        res.status(201).json({
            message: 'Noticia creada correctamente',
            data
        })
    } catch (error) {
        next(error)
    }
}

const putNoticia = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Noticia.findOneAndReplace({ _id }, req.body, {
            returnDocument: 'after',
            runValidators: true
        })
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

const patchNoticia = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Noticia.findByIdAndUpdate(_id, { $set: req.body }, {
            returnDocument: 'after',
            runValidators: true
        })
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

const deleteNoticia = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Noticia.findByIdAndDelete(_id)
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

module.exports = {
    getNoticias,
    getNoticiaById,
    postNoticia,
    putNoticia,
    patchNoticia,
    deleteNoticia
}
