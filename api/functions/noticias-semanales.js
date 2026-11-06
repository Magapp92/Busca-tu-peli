
/* Función programada de Netlify: cada lunes refresca las valoraciones de TMDB, regenera las noticias de datos
y envía la newsletter a los suscriptores. La programación está en netlify.toml ([functions."noticias-semanales"]) */
const { conectar } = require('../index')
const { generarNoticias } = require('../services/noticias')
const { enviarNewsletter } = require('../services/correos')

exports.handler = async () => {
    try {
        /* Conectamos con Mongo y generamos las noticias; el resultado queda en los logs de Netlify */
        await conectar()
        const { valoraciones, noticias } = await generarNoticias()

        console.log(`Valoraciones actualizadas: ${valoraciones.actualizadas} de ${valoraciones.total}`)
        noticias.forEach(( noticia ) => console.log(`Noticia: ${noticia}`))

        /* La newsletter va después, con las noticias ya actualizadas; si falla, las noticias quedan hechas */
        try {
            const newsletter = await enviarNewsletter()
            console.log(newsletter.enviada
                ? `Newsletter enviada a ${newsletter.suscriptores} suscriptores (campaña ${newsletter.campana})`
                : `Newsletter no enviada: ${newsletter.motivo}`)
        } catch (error) {
            console.log(`Error enviando la newsletter: ${error.message}`)
        }

        return { statusCode: 200 }
    } catch (error) {
        console.log(`Error generando noticias: ${error.message}`)
        return { statusCode: 500 }
    }
}
