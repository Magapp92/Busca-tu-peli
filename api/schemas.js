const mongoose = require('mongoose')

const { String, Number, Boolean, Date, ObjectId } = mongoose.Schema.Types

/* Claves de plataforma que el front sabe pintar (logo, color y nombre) */
const PLATAFORMAS = ['netflix', 'prime', 'disney', 'max', 'appletv']

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
        titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true },
        tituloOriginal: { type: String, trim: true },
        sinopsis: { type: String, required: [true, 'La sinopsis es obligatoria'] },
        poster: { type: String, required: [true, 'El póster es obligatorio'] },
        /* Imagen horizontal para el hero y el fondo de la ficha */
        backdrop: { type: String, default: '' },
        trailer: { type: String, default: '' },
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
                url: { type: String, required: true }
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
        titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true },
        entradilla: { type: String, required: [true, 'La entradilla es obligatoria'] },
        imagen: { type: String, default: '' },
        categoria: { type: String, default: 'General' },
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
                poster: { type: String },
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
        nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            trim: true,
            lowercase: true,
            match: [/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'El email no tiene un formato válido']
        },
        pelicula: { type: String, required: [true, 'Indica qué película echaste en falta'], trim: true },
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
