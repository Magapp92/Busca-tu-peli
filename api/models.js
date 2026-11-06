
/* Creamos los modelos de Mongoose que usan los controllers. El nombre del modelo es el
primer parámetro; la colección real la fija cada schema con la opción collection */
const mongoose = require('mongoose')

const { peliculaSchema, noticiaSchema, recomendacionSchema, suscripcionSchema } = require('./schemas')

/* Un modelo por colección: películas, noticias, recomendaciones y suscripciones */
const Pelicula = mongoose.model(`Pelicula`, peliculaSchema )

const Noticia = mongoose.model(`Noticia`, noticiaSchema )

const Recomendacion = mongoose.model(`Recomendacion`, recomendacionSchema )

const Suscripcion = mongoose.model(`Suscripcion`, suscripcionSchema )

/* Exportamos los modelos para usarlos en los controllers */
module.exports = {
    Pelicula,
    Noticia,
    Recomendacion,
    Suscripcion
}
