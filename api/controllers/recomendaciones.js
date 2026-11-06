
/* Controlador de recomendaciones: el formulario público crea sugerencias de películas
y el panel las lista, cambia su estado o las borra; todas las respuestas siguen la forma { message, data } */
const { Recomendacion } = require('../models')
const { enviarGraciasSugerencia, enviarAvisoSugerencia, enviarSugerenciaAnadida } = require('../services/correos')

/* Listado para el panel, opcionalmente por estado: ?estado=pendiente */
const getRecomendaciones = async (req, res, next) => {
    try {
        /* Recogemos el estado de la URL; si llega repetido nos quedamos con el primero */
        const estado = Array.isArray(req.query.estado) ? req.query.estado[0] : req.query.estado
        const filtro = estado ? { estado: String(estado) } : {}

        /* Las más recientes primero */
        const data = await Recomendacion.find(filtro).sort({ createdAt: -1 })

        res.status(200).json({
            message: `Mostrando ${data.length} recomendaciones`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Una recomendación concreta por su _id */
const getRecomendacionById = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Recomendacion.findById(_id)
        /* 404 si el id no existe */
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
        /* Recogemos lo que envía el formulario de recomendaciones */
        const { nombre, email, pelicula, web } = req.body || {}

        /* Trampa para bots: "web" es un campo oculto que una persona nunca rellena.
        Respondemos como si todo fuera bien para que el bot no sepa que lo hemos detectado */
        if (web) {
            return res.status(201).json({
                message: '¡Gracias! Te avisaremos cuando la añadamos al catálogo',
                data: null
            })
        }

        /* Solo aceptamos texto: un objeto en lugar de un texto se rechaza */
        if ([nombre, email, pelicula].some(( valor ) => valor !== undefined && typeof valor !== 'string')) {
            return res.status(400).json({
                message: 'Datos no válidos',
                data: null
            })
        }

        const data = await Recomendacion.create({ nombre, email, pelicula })

        /* Correos: el aviso al equipo siempre; el agradecimiento solo una vez al día por email,
        para que el formulario no sirva para mandar correos repetidos a una dirección ajena.
        Si fallan no rompemos la respuesta: la sugerencia ya está guardada */
        const haceUnDia = new Date(Date.now() - 24 * 3600 * 1000)
        const delMismoEmail = await Recomendacion.countDocuments({ email: data.email, createdAt: { $gte: haceUnDia } })
        const correos = [enviarAvisoSugerencia(data)]
        if (delMismoEmail <= 1) correos.push(enviarGraciasSugerencia(data))
        const resultados = await Promise.allSettled(correos)
        resultados
            .filter(( r ) => r.status === 'rejected')
            .forEach(( r ) => console.error(`Correo de sugerencia no enviado: ${r.reason.message}`))

        res.status(201).json({
            message: '¡Gracias! Te avisaremos cuando la añadamos al catálogo',
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Desde el panel solo se cambia el estado (pendiente, añadida o descartada): el nombre y el email no se tocan */
const patchRecomendacion = async (req, res, next) => {
    try {
        const { _id } = req.params
        const { estado } = req.body || {}

        const data = await Recomendacion.findByIdAndUpdate(_id, { $set: { estado } }, {
            returnDocument: 'after',
            runValidators: true
        })
        /* 404 si el id no existe */
        if (!data) {
            return res.status(404).json({
                message: `No existe la recomendación con id ${_id}`,
                data: null
            })
        }

        /* Al marcarla como añadida avisamos por correo a quien la sugirió (una sola vez).
        Si el correo falla, el cambio de estado se guarda igual y el mensaje lo indica */
        let aviso = ''
        if (data.estado === 'añadida' && !data.avisadaEn) {
            try {
                await enviarSugerenciaAnadida(data)
                data.avisadaEn = new Date()
                await data.save()
                aviso = ` y aviso enviado a ${data.email}`
            } catch (error) {
                console.error(`No se pudo avisar de la sugerencia añadida: ${error.message}`)
                aviso = ', pero no se pudo enviar el aviso por correo'
            }
        }

        res.status(200).json({
            message: `Recomendación marcada como ${data.estado}${aviso}`,
            data
        })
    } catch (error) {
        next(error)
    }
}

/* Borra la recomendación */
const deleteRecomendacion = async (req, res, next) => {
    try {
        const { _id } = req.params

        const data = await Recomendacion.findByIdAndDelete(_id)
        /* 404 si el id no existe */
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


/* Exportamos los controllers para el router */
module.exports = {
getRecomendaciones,
getRecomendacionById,
postRecomendacion,
patchRecomendacion,
deleteRecomendacion
}
