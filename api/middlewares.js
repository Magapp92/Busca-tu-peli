/* 404: ninguna ruta coincide */
const notFound = (req, res, next) => {
    const error = new Error('Endpoint no existe')
    error.status = 404
    next(error)
}

/* Errores centralizados: validación de Mongoose e ids mal formados son 400 */
const errorHandler = (error, req, res, next) => {
    let { status, message } = error

    if (error.name === 'ValidationError') {
        status = 400
        message = Object.values(error.errors).map((e) => e.message).join('. ')
    }

    if (error.name === 'CastError') {
        status = 400
        message = `Valor no válido: ${error.value}`
    }

    status = status || 500
    message = message || 'Error interno'

    res.status(status).json({ message, data: null })
}

module.exports = {
    notFound,
    errorHandler
}
