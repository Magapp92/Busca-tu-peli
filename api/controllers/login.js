
/* jsonwebtoken firma el token de sesión; crypto compara la clave sin dar pistas por el tiempo de respuesta */
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

/* Compara dos textos en tiempo constante: así no se puede adivinar la clave midiendo cuánto tarda */
const iguales = ( a, b ) => {
    const x = Buffer.from(String(a))
    const y = Buffer.from(String(b))
    return x.length === y.length && crypto.timingSafeEqual(x, y)
}

/* Comprueba la clave de administrador del formulario del panel con la ADMIN_KEY del servidor */
const postLogin = async ( req, res, next ) => {
    try {

        /* Recogemos lo que envía el formulario de login */
        const { clave } = req.body || {}
        const { ADMIN_KEY, JWT_SECRET } = process.env

        /* Sin ADMIN_KEY o JWT_SECRET no se puede iniciar sesión: el servidor está mal configurado */
        if (!ADMIN_KEY || !JWT_SECRET) {
            return res.status(503).json({
                message: 'Falta configurar ADMIN_KEY o JWT_SECRET en el servidor',
                data: null
            })
        }

        /* 401 si la clave no coincide */
        if (typeof clave !== 'string' || !iguales(clave, ADMIN_KEY)) {
            return res.status(401).json({
                message: 'Clave de administrador incorrecta',
                data: null
            })
        }

        /* Token firmado con el rol que caduca en 8 horas; la clave no se devuelve */
        const token = jwt.sign({
            rol: 'admin'
        },
        JWT_SECRET,
        {
            expiresIn: '8h'

        })

        /* Devolvemos los datos de la sesión y el token */
        res.status(200).json({
            message: 'Login correcto',
            data:
            {
            rol: 'admin',
            token
            }
        })
    } catch (error)
    {
      next(error)
    }
}

/* Exportamos el controller para el router */
module.exports = {
    postLogin
}
