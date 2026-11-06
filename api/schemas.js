/* Schemas de las 3 colecciones. Los required, enum y validate evitan guardar documentos incompletos
o con valores que el front no sabe pintar (plataforma, estado de la recomendación o direcciones peligrosas) */
const mongoose = require('mongoose')

/* Claves de plataforma que el front sabe pintar (logo, color y nombre) */
const PLATAFORMAS = ['netflix', 'prime', 'disney', 'max', 'appletv']

/* URLs permitidas: solo https o rutas de la propia web (assets/...). Así nunca se guarda un "javascript:" */
const URL_SEGURA = /^(https:\/\/[^\s"'<>]+|assets\/[^\s"'<>:]+)$/
const urlSegura = ( campo ) => ({
    validator: ( valor ) => !valor || URL_SEGURA.test(valor),
    message: `${campo}: solo se admiten direcciones https o rutas de assets/`
})

/* El tráiler se incrusta en un iframe: solo vídeos de YouTube */
const URL_TRAILER = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]+(\?[\w=&%.-]*)?$/
const urlTrailer = {
    validator: ( valor ) => !valor || URL_TRAILER.test(valor),
    message: 'El tráiler debe ser un enlace de YouTube con el formato https://www.youtube.com/embed/...'
}

/* Película del catálogo con su ficha, dónde verla y su valoración en TMDB */
const peliculaSchema = new mongoose.Schema(
    {
      _id: { type: mongoose.Schema.Types.ObjectId , auto : true },
      /* Id en TMDB de las películas importadas: evita duplicados al reimportar */
      tmdbId: { type: mongoose.Schema.Types.Number, unique: true, sparse: true },
      /* Datos que se ven en la tarjeta y en la ficha */
      titulo: { type: mongoose.Schema.Types.String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 200 },
      tituloOriginal: { type: mongoose.Schema.Types.String, trim: true, maxlength: 200 },
      sinopsis: { type: mongoose.Schema.Types.String, required: [true, 'La sinopsis es obligatoria'], maxlength: 5000 },
      poster: { type: mongoose.Schema.Types.String, required: [true, 'El póster es obligatorio'], validate: urlSegura('Póster') },
      /* Imagen horizontal para el carrusel y el fondo de la ficha */
      backdrop: { type: mongoose.Schema.Types.String, default: '', validate: urlSegura('Imagen apaisada') },
      trailer: { type: mongoose.Schema.Types.String, default: '', validate: urlTrailer },
      anio: { type: mongoose.Schema.Types.Number, min: 1888, max: 2100 },
      duracionMin: { type: mongoose.Schema.Types.Number, min: 0 },
      pais: { type: mongoose.Schema.Types.String },
      /* Ficha técnica */
      direccion: [{ type: mongoose.Schema.Types.String }],
      guion: [{ type: mongoose.Schema.Types.String }],
      reparto: [{ type: mongoose.Schema.Types.String }],
      companias: [{ type: mongoose.Schema.Types.String }],
      generos: [{ type: mongoose.Schema.Types.String }],
      /* Dónde verla: la clave solo puede ser una plataforma que el front sabe pintar */
      plataformas: [
        {
        _id: false,
        clave: { type: mongoose.Schema.Types.String, required: true, enum: { values: PLATAFORMAS, message: 'Plataforma no válida: {VALUE}' } },
        url: { type: mongoose.Schema.Types.String, required: true, validate: urlSegura('Enlace de la plataforma') }
        }
      ],
      destacada: { type: mongoose.Schema.Types.Boolean, default: false },
      /* Datos de TMDB que se refrescan cada semana: nota media (0-10), nº de votos y popularidad */
      valoracion: { type: mongoose.Schema.Types.Number, min: 0, max: 10 },
      votos: { type: mongoose.Schema.Types.Number, min: 0 },
      popularidad: { type: mongoose.Schema.Types.Number, min: 0 }
    },
    {
      collection: 'peliculas',
      /* Collation en español: las búsquedas no distinguen mayúsculas ni tildes */
       collation: {
            locale: 'es',
            strength: 1
        },
        versionKey: false,
        /* createdAt y updatedAt: el panel ordena por fecha de alta */
        timestamps: true
    }
)

/* Noticia con su cuerpo y, en las generadas con datos, el ranking de películas */
const noticiaSchema = new mongoose.Schema(
    {
      _id: { type: mongoose.Schema.Types.ObjectId , auto : true },
      /* Datos que se ven en la tarjeta de la noticia */
      titulo: { type: mongoose.Schema.Types.String, required: [true, 'El título es obligatorio'], trim: true, maxlength: 200 },
      entradilla: { type: mongoose.Schema.Types.String, required: [true, 'La entradilla es obligatoria'], maxlength: 1000 },
      imagen: { type: mongoose.Schema.Types.String, default: '', validate: urlSegura('Imagen') },
      categoria: { type: mongoose.Schema.Types.String, default: 'General', maxlength: 60 },
      fecha: { type: mongoose.Schema.Types.Date, default: Date.now },
      /* Cuerpo de la noticia que se ve al abrirla */
      parrafos: [{ type: mongoose.Schema.Types.String }],
      lista: [{ type: mongoose.Schema.Types.String }],
      /* Noticias generadas con datos (npm run noticias y la función semanal):
      la clave identifica cada una para actualizarla en lugar de duplicarla */
      clave: { type: mongoose.Schema.Types.String, unique: true, sparse: true },
      ranking: [
        {
        _id: false,
        posicion: { type: mongoose.Schema.Types.Number },
        titulo: { type: mongoose.Schema.Types.String },
        anio: { type: mongoose.Schema.Types.Number },
        poster: { type: mongoose.Schema.Types.String, validate: urlSegura('Póster') },
        valoracion: { type: mongoose.Schema.Types.Number },
        votos: { type: mongoose.Schema.Types.Number },
        plataformas: [{ type: mongoose.Schema.Types.String }],
        /* Solo si la película está en el catálogo: enlaza con su ficha */
        pelicula: { type: mongoose.Schema.Types.ObjectId, ref: 'Pelicula' }
        }
      ]
    },
    {
      collection: 'noticias',
       collation: {
            locale: 'es',
            strength: 1
        },
        versionKey: false,
        timestamps: true
    }
)

/* Sugerencia de película que deja un usuario en el formulario de recomendaciones */
const recomendacionSchema = new mongoose.Schema(
    {
      _id: { type: mongoose.Schema.Types.ObjectId , auto : true },
      /* Datos del usuario: nombre y email obligatorios, con un largo máximo */
      nombre: { type: mongoose.Schema.Types.String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: [80, 'El nombre es demasiado largo'] },
      email: {
        type: mongoose.Schema.Types.String,
        required: [true, 'El email es obligatorio'],
        trim: true,
        lowercase: true,
        maxlength: [120, 'El email es demasiado largo'],
        match: [/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'El email no tiene un formato válido']
      },
      pelicula: { type: mongoose.Schema.Types.String, required: [true, 'Indica qué película echaste en falta'], trim: true, maxlength: [300, 'El texto de la película es demasiado largo'] },
      /* El estado solo admite los valores que entiende el panel */
      estado: { type: mongoose.Schema.Types.String, default: 'pendiente', enum: { values: ['pendiente', 'añadida', 'descartada'], message: 'Estado no válido: {VALUE}' } }
    },
    {
      collection: 'recomendaciones',
       collation: {
            locale: 'es',
            strength: 1
        },
        versionKey: false,
        /* createdAt: el panel muestra y ordena las sugerencias por fecha */
        timestamps: true
    }
)

/* Suscripción a la newsletter con doble confirmación: queda pendiente hasta que la persona
pulsa el enlace del correo; entonces pasa a confirmada y se añade a la lista de Brevo */
const suscripcionSchema = new mongoose.Schema(
    {
      _id: { type: mongoose.Schema.Types.ObjectId , auto : true },
      email: {
        type: mongoose.Schema.Types.String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: [120, 'El email es demasiado largo'],
        match: [/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/, 'El email no tiene un formato válido']
      },
      estado: { type: mongoose.Schema.Types.String, default: 'pendiente', enum: ['pendiente', 'confirmada'] },
      /* Token del enlace de confirmación y hasta cuándo vale (48 horas) */
      token: { type: mongoose.Schema.Types.String },
      caducaToken: { type: mongoose.Schema.Types.Date },
      /* Prueba del consentimiento (RGPD): cuándo aceptó y cuándo confirmó */
      consentimientoEn: { type: mongoose.Schema.Types.Date },
      confirmadaEn: { type: mongoose.Schema.Types.Date }
    },
    {
      collection: 'suscripciones',
       collation: {
            locale: 'es',
            strength: 1
        },
        versionKey: false,
        timestamps: true
    }
)

/* Exportamos los schemas para crear los modelos en models.js */
module.exports = {
    PLATAFORMAS,
    peliculaSchema,
    noticiaSchema,
    recomendacionSchema,
    suscripcionSchema
}
