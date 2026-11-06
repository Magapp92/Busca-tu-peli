/* Formulario de sugerencias: valida en el cliente y guarda con POST /recomendaciones */

// IIFE que agrupa el formulario para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const form = document.querySelector('[data-element="form"]')
    const mensaje = document.querySelector('[data-element="mensaje"]')
    const boton = form.querySelector('[type="submit"]')

    /* Regla de cada campo: devuelve el texto del error o '' si es válido */
    const REGLAS = {
        nombre: (v) => (v.length >= 2 ? '' : 'Escribe tu nombre'),
        email: (v) => (/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v) ? '' : 'Introduce un email válido'),
        pelicula: (v) => (v.length >= 2 ? '' : 'Dinos qué película echaste en falta')
    }

    /* Validamos un campo y mostramos su error debajo */
    const validar = (campo) => {
        const error = REGLAS[campo.name](campo.value.trim())
        const field = campo.closest('.Field')
        field.classList.toggle('hasError', !!error)
        field.querySelector('.Field-error').textContent = error
        campo.setAttribute('aria-invalid', !!error)
        return !error
    }

    /* Cada campo se valida al salir de él y, si ya tenía error, mientras se escribe */
    Object.keys(REGLAS).forEach((nombre) => {
        const campo = form.elements[nombre]
        campo.addEventListener('blur', () => validar(campo))
        campo.addEventListener('input', () => campo.closest('.Field').classList.contains('hasError') && validar(campo))
    })

    /* Al enviar: validamos todo, mandamos a la API y mostramos el resultado */
    form.addEventListener('submit', (e) => {
        e.preventDefault()
        mensaje.innerHTML = ''
        const campos = Object.keys(REGLAS).map((nombre) => form.elements[nombre])
        const validos = campos.map(validar).every(Boolean)
        if (!validos) return campos.find((c) => c.getAttribute('aria-invalid') === 'true').focus()

        boton.disabled = true
        boton.textContent = 'Enviando…'
        const body = Object.fromEntries(campos.map((c) => [c.name, c.value.trim()]))
        /* Campo trampa para bots: si viene relleno, la API descarta el envío */
        body.web = form.elements.web.value

        api.recomendaciones.crear(body)
            .then(() => {
                form.reset()
                mensaje.innerHTML = `<div class="Alert Alert--success" role="status">${ICON.check}<span>¡Gracias, ${esc(body.nombre.split(' ')[0])}! Hemos recibido tu sugerencia de <b>${esc(body.pelicula)}</b>. Te escribiremos a ${esc(body.email)} cuando la añadamos.</span></div>`
            })
            .catch((error) => {
                mensaje.innerHTML = `<div class="Alert Alert--error" role="alert">${ICON.alert}<span>${esc(error.message)}</span></div>`
            })
            .finally(() => {
                boton.disabled = false
                boton.textContent = 'Enviar sugerencia'
            })
    })

})()
