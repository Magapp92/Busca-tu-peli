/* Función programada de Netlify: cada lunes refresca las valoraciones de TMDB y regenera las noticias de datos.
   La programación está en netlify.toml ([functions."noticias-semanales"]) */
const { conectar } = require('../app')
const { generarNoticias } = require('../services/noticias')

exports.handler = async () => {
    try {
        await conectar()
        const { valoraciones, noticias } = await generarNoticias()
        console.log(`Valoraciones actualizadas: ${valoraciones.actualizadas} de ${valoraciones.total}`)
        noticias.forEach((n) => console.log(`Noticia: ${n}`))
        return { statusCode: 200 }
    } catch (error) {
        console.log(`Error generando noticias: ${error.message}`)
        return { statusCode: 500 }
    }
}
