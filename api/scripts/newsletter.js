
/* Envía la newsletter semanal a mano.
Uso: npm run newsletter -- --prueba correo@ejemplo.com   → solo a ese correo, para ver cómo queda
     npm run newsletter -- --atlas                      → a todos los suscriptores, con los datos de Atlas
En producción la envía sola cada lunes la función programada de Netlify (functions/noticias-semanales.js) */
require('dotenv').config({ quiet: true })
const mongoose = require('mongoose')
const { enviarNewsletter } = require('../services/correos')

const argumentos = process.argv.slice(2)
const prueba = argumentos.includes('--prueba') ? argumentos[argumentos.indexOf('--prueba') + 1] : null
const uri = argumentos.includes('--atlas') ? process.env.MONGO_URI_ATLAS : process.env.MONGO_URI

const ejecutar = async () => {
    try {
        await mongoose.connect(uri, { dbName: 'buscatupeli', serverSelectionTimeoutMS: 10000 })
        const resultado = await enviarNewsletter({ prueba })
        console.log(resultado.enviada ? `📧 Newsletter enviada ${prueba ? `a ${prueba}` : `a ${resultado.suscriptores} suscriptores`}` : `Newsletter no enviada: ${resultado.motivo}`)
    } catch (error) {
        console.log(`Error enviando la newsletter: ${error.message}`)
        process.exitCode = 1
    } finally {
        await mongoose.disconnect()
    }
}

ejecutar()
