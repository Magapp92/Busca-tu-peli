const mongoose = require('mongoose')

const { String, Number, Boolean, Date, ObjectId } = mongoose.Schema.Types

/* Claves de plataforma que el front sabe pintar (logo, color y nombre) */
const PLATAFORMAS = ['netflix', 'prime', 'disney', 'max', 'appletv']

/* URLs permitidas: solo https o rutas de la propia web (assets/...). Así nunca se guarda un "javascript:" */
const URL_SEGURA = /^(https:\/\/[^\s"'<>]+|assets\/[^\s"'<>:]+)$/
const urlSegura = (campo) => ({
    validator: (v) => !v || URL_SEGURA.test(v),
    message: `${campo}: solo se admiten direcciones https o rutas de assets/`
})

/* El tráiler se incrusta en un iframe: solo vídeos de YouTube */
const URL_TRAILER = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]+(\?[\w=&%.-]*)?$/
const urlTrailer = {
    validator: (v) => !v || URL_TRAILER.test(v),
    message: 'El tráiler debe ser un enlace de YouTube con el formato https://www.youtube.com/embed/...'
}

const opciones = (collection) => ({
    collection,
    /* Collation en español: búsquedas sin distinguir mayúsculas ni tildes */
    collation: { locale: 'es', strength: 1 },
    versionKey: false,
    timestamps: true
})

const peliculaSchema = new mongoose.Schema(
    {
        _id: { type: ObjectId, auto: true },
        /* Id en TMDB de las películas importadas: evita duplicados al reimportar */
        tmdbId: { type: Number, unique: true, sparse: true },
        titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 200 },
        tituloOriginal: { type: String, trim: true, maxlength: 200 },
        sinopsis: { type: String, required: [true, 'La sinopsis es obligatoria'], maxlength: 5000 },
        poster: { type: String, required: [true, 'El póster es obligatorio'], validate: urlSegura('Póster') },
        /* Imagen horizontal para el hero y el fondo de la ficha */
        backdrop: { type: String, default: '', validate: urlSegura('Imagen apaisada') },
        trailer: { type: String, default: '', validate: urlTrailer },
        anio: { type: Number, min: 1888, max: 2100 },
        duracionMin: { type: Number, min: 0 },
        pais: { type: String },
        direccion: [{ type: String }],
        guion: [{ type: String }],
        reparto: [{ type: String }],
        companias: [{ type: String }],
        generos: [{ type: String }],
        plataformas: [
            {
                _id: false,
                clave: { type: String, required: true, enum: { values: PLATAFORMAS, message: 'Plataforma no válida: {VALUE}' } },
                url: { type: String, required: true, validate: urlSegura('Enlace de la plataforma') }
            }
        ],
        destacada: { type: Boolean, default: false },
        /* Datos de TMDB que se refrescan cada semana: nota media (0-10), nº de votos y popularidad */
        valoracion: { type: Number, min: 0, max: 10 },
        votos: { type: Number, min: 0 },
        popularidad: { type: Number, min: 0 }
    },
    opciones('peliculas')
)

const noticiaSchema = new mongoose.Schema(
    {
        _id: { type: ObjectId, auto: true },
        titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 200 },
        entradilla: { type: String, required: [true, 'La entradilla es obligatoria'], maxlength: 1000 },
        imagen: { type: String, default: '', validate: urlSegura('Imagen') },
        categoria: { type: String, default: 'General', maxlength: 60 },
        fecha: { type: Date, default: () => new globalThis.Date() },
        parrafos: [{ type: String }],
        lista: [{ type: String }],
        /* Noticias generadas con datos (npm run noticias y la función semanal):
           la clave identifica cada una para actualizarla en lugar de duplicarla */
        clave: { type: String, unique: true, sparse: true },
        ranking: [
            {
                _id: false,
                posicion: { type: Number },
                titulo: { type: String },
                anio: { type: Number },
                poster: { type: String, validate: urlSegura('Póster') },
                valoracion: { type: Number },
                votos: { type: Number },
                plataformas: [{ type: String }],
                /* Solo si la película está en el catálogo: enlaza con su ficha */
                pelicula: { type: ObjectId, ref: 'Pelicula' }
            }
        ]
    },
    opciones('noticias')
)

const recomendacionSchema = new mongoose.Schema(
    {
        _id: { type: ObjectId, auto: true },
        nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: [80, 'El nombre es demasiado largo'] },
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            trim: true,
            lowercase: true,
            maxlength: [120, 'El email es demasiado largo'],
            match: [/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'El email no tiene un formato válido']
        },
        pelicula: { type: String, required: [true, 'Indica qué película echaste en falta'], trim: true, maxlength: [300, 'El texto de la película es demasiado largo'] },
        estado: { type: String, default: 'pendiente', enum: { values: ['pendiente', 'añadida', 'descartada'], message: 'Estado no válido: {VALUE}' } }
    },
    opciones('recomendaciones')
)

module.exports = {
    PLATAFORMAS,
    peliculaSchema,
    noticiaSchema,
    recomendacionSchema
}
