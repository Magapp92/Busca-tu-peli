/* Copia películas y noticias de la base local (MONGO_URI) a Atlas (MONGO_URI_ATLAS).
   Uso: npm run copiar-a-atlas  ·  Sustituye lo que haya en Atlas en esas dos colecciones */
require('dotenv').config({ quiet: true })
const mongoose = require('mongoose')
const { peliculaSchema, noticiaSchema } = require('./schemas')

const { MONGO_URI, MONGO_URI_ATLAS } = process.env

const copiar = async () => {
    if (!MONGO_URI_ATLAS) {
        console.log('Falta MONGO_URI_ATLAS en api/.env')
        process.exitCode = 1
        return
    }

    const origen = await mongoose.createConnection(MONGO_URI, { serverSelectionTimeoutMS: 5000 }).asPromise()
    const destino = await mongoose.createConnection(MONGO_URI_ATLAS, { serverSelectionTimeoutMS: 10000 }).asPromise()

    try {
        for (const [nombre, schema] of [['Pelicula', peliculaSchema], ['Noticia', noticiaSchema]]) {
            const docs = await origen.model(nombre, schema).find().lean()
            const ModeloDestino = destino.model(nombre, schema)
            await ModeloDestino.deleteMany({})
            await ModeloDestino.insertMany(docs)
            console.log(`☁️  ${docs.length} ${schema.options.collection} copiadas a Atlas`)
        }
        await destino.model('Pelicula', peliculaSchema).syncIndexes()
    } catch (error) {
        console.log(`Error copiando a Atlas: ${error.message}`)
        process.exitCode = 1
    } finally {
        await origen.close()
        await destino.close()
    }
}

copiar()
