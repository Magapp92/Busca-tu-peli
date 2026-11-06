
/* Función de Netlify: la misma API de Express (index.js) envuelta con serverless-http.
netlify.toml redirige /buscatupeli/* aquí; quitamos el prefijo interno de la función por si llega */
const serverless = require('serverless-http')

/* En producción las escrituras exigen ADMIN_KEY y JWT_SECRET aunque no estén definidas (ver middlewares.js) */
process.env.EN_PRODUCCION = 'true'

const { app } = require('../index')

const manejador = serverless(app)

exports.handler = async ( event, context ) => {
    event.path = event.path.replace(/^\/\.netlify\/functions\/api/, '') || '/'
    /* Mantiene viva la conexión a Mongo entre peticiones sin bloquear la respuesta */
    context.callbackWaitsForEmptyEventLoop = false
    return manejador(event, context)
}
