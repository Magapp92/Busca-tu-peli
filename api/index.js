console.clear()
console.log('Iniciando Busca tu peli API 🎬')

const path = require('path')
require('dotenv').config()
const { crearApp, conectar } = require('./app')

const { PORT = 3100 } = process.env

/* En local la API también sirve el front: http://localhost:PORT */
const app = crearApp({ staticDir: path.join(__dirname, '..', 'frontend') })

conectar()
    .then(() => console.log('Conectado a Mongo 🔗'))
    .catch((error) => console.log(`Sin conexión a Mongo: ${error.message}`))

/* En Express 5 el error de arranque (p. ej. puerto ocupado) llega al callback */
app.listen(PORT, (error) => {
    if (error) {
        console.log(`❌ No se pudo arrancar en el puerto ${PORT}: ${error.code === 'EADDRINUSE' ? 'puerto ocupado, cambia PORT en .env' : error.message}`)
        process.exit(1)
    }
    console.log(`✅ API en http://localhost:${PORT}/buscatupeli  ·  Web en http://localhost:${PORT}`)
})

module.exports = app
