/* Función de Netlify: la misma API de Express envuelta con serverless-http.
   netlify.toml redirige /buscatupeli/* aquí; quitamos el prefijo interno de la función por si llega */
const serverless = require('serverless-http')
const { crearApp } = require('../app')

/* En producción las escrituras exigen ADMIN_KEY aunque no esté definida (ver middlewares.js) */
process.env.EN_PRODUCCION = 'true'

const manejador = serverless(crearApp())

exports.handler = async (event, context) => {
    event.path = event.path.replace(/^\/\.netlify\/functions\/api/, '') || '/'
    /* Mantiene viva la conexión a Mongo entre peticiones sin bloquear la respuesta */
    context.callbackWaitsForEmptyEventLoop = false
    return manejador(event, context)
}
