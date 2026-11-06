const { Recomendacion } = require('../models')

/* Listado para el panel admin, opcionalmente por estado: ?estado=pendiente */
const getRecomendaciones = async (req, res, next) => {
    try {
        const estado = Array.isArray(req.query.estado) ? req.query.estado[0] : req.query.estado
        const filtro = estado ? { estado: String(estado) } : {}

        const data = await Recomendacion.find(filtro).sort({ createdAt: -1 })

        res.status(200).json({
            message: `Mostrando ${data.length} recomendaciones`,
            data
        })
    } catch (error) {
        next(error)
    }
}

const getRecomendacionById = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Recomendacion.findById(_id)
        if (!data) {
            return res.status(404).json({
                message: `No existe la recomendación con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Mostrando la recomendación con id ${_id}`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* El formulario público solo puede mandar nombre, email y película: el estado lo decide el admin */
const postRecomendacion = async (req, res, next) => {
    try {
        const { nombre, email, pelicula, web } = req.body || {}

        /* Trampa para bots: "web" es un campo oculto que una persona nunca rellena.
           Respondemos como si todo fuera bien para que el bot no sepa que lo hemos detectado */
        if (web) {
            return res.status(201).json({ message: '¡Gracias! Te avisaremos cuando la añadamos al catálogo', data: null })
        }

        /* Solo aceptamos texto: un objeto en lugar de un texto se rechaza */
        if ([nombre, email, pelicula].some((v) => v !== undefined && typeof v !== 'string')) {
            return res.status(400).json({ message: 'Datos no válidos', data: null })
        }

        const data = await Recomendacion.create({ nombre, email, pelicula })

        res.status(201).json({
            message: '¡Gracias! Te avisaremos cuando la añadamos al catálogo',
            data
        })
    } catch (error) {
        next(error)
    }
}

const patchRecomendacion = async (req, res, next) => {
    try {
        const { _id } = req.params

        /* Desde el admin solo se cambia el estado: el nombre y el email del usuario no se tocan */
        const { estado } = req.body || {}
        const data = await Recomendacion.findByIdAndUpdate(_id, { $set: { estado } }, {
            returnDocument: 'after',
            runValidators: true
        })
        if (!data) {
            return res.status(404).json({
                message: `No existe la recomendación con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Recomendación ${_id} modificada correctamente`,
            data
        })
    } catch (error) {
        next(error)
    }
}

const deleteRecomendacion = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Recomendacion.findByIdAndDelete(_id)
        if (!data) {
            return res.status(404).json({
                message: `No existe la recomendación con id ${_id}`,
                data: null
            })
        }

        res.status(200).json({
            message: `Recomendación ${_id} eliminada correctamente`,
            data
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getRecomendaciones,
    getRecomendacionById,
    postRecomendacion,
    patchRecomendacion,
    deleteRecomendacion
}
