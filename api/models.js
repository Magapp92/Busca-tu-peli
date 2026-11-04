const mongoose = require('mongoose')

const { peliculaSchema, noticiaSchema, recomendacionSchema } = require('./schemas')

const Pelicula = mongoose.model('Pelicula', peliculaSchema)

const Noticia = mongoose.model('Noticia', noticiaSchema)

const Recomendacion = mongoose.model('Recomendacion', recomendacionSchema)

module.exports = {
    Pelicula,
    Noticia,
    Recomendacion
}
