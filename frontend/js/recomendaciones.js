/* Formulario de sugerencias: valida en el cliente y guarda con POST /recomendaciones */
import { api } from './api.js'
import { $, esc, ICON } from './ui.js'

const form = $('[data-form]')
const mensaje = $('[data-mensaje]')
const boton = form.querySelector('[type="submit"]')

const REGLAS = {
    nombre: (v) => (v.length >= 2 ? '' : 'Escribe tu nombre'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v) ? '' : 'Introduce un email válido'),
    pelicula: (v) => (v.length >= 2 ? '' : 'Dinos qué película echaste en falta')
}

const validar = (campo) => {
    const error = REGLAS[campo.name](campo.value.trim())
    const field = campo.closest('.field')
    field.classList.toggle('has-error', !!error)
    field.querySelector('.field__error').textContent = error
    campo.setAttribute('aria-invalid', !!error)
    return !error
}

Object.keys(REGLAS).forEach((n) => {
    const campo = form.elements[n]
    campo.addEventListener('blur', () => validar(campo))
    campo.addEventListener('input', () => campo.closest('.field').classList.contains('has-error') && validar(campo))
})

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    mensaje.innerHTML = ''
    const campos = Object.keys(REGLAS).map((n) => form.elements[n])
    const validos = campos.map(validar).every(Boolean)
    if (!validos) return campos.find((c) => c.getAttribute('aria-invalid') === 'true').focus()

    boton.disabled = true
    boton.textContent = 'Enviando…'
    try {
        const body = Object.fromEntries(campos.map((c) => [c.name, c.value.trim()]))
        await api.recomendaciones.crear(body)
        form.reset()
        mensaje.innerHTML = `<div class="alert alert--success" role="status">${ICON.check}<span>¡Gracias, ${esc(body.nombre.split(' ')[0])}! Hemos recibido tu sugerencia de <b>${esc(body.pelicula)}</b>. Te escribiremos a ${esc(body.email)} cuando la añadamos.</span></div>`
    } catch (error) {
        mensaje.innerHTML = `<div class="alert alert--error" role="alert">${ICON.alert}<span>${esc(error.message)}</span></div>`
    } finally {
        boton.disabled = false
        boton.textContent = 'Enviar sugerencia'
    }
})
