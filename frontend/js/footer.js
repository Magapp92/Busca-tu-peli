/* Comportamiento del footer que está escrito en cada página: año actual, suscripción a la newsletter
y avisos al volver del enlace de confirmación del correo */

// IIFE que agrupa el footer para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const anio = document.querySelector('[data-element="anio"]')
    const newsletterForm = document.querySelector('.Footer-form')
    const newsletterEmail = newsletterForm.elements.email
    const newsletterConsentimiento = newsletterForm.elements.consentimiento
    const newsletterWeb = newsletterForm.elements.web
    const newsletterBoton = newsletterForm.querySelector('[type="submit"]')
    const params = new URLSearchParams(location.search)

    /* Mensajes al volver del enlace de confirmación (?suscripcion=...) */
    const AVISOS = {
        confirmada: ['¡Suscripción confirmada! Cada lunes te llegará lo más interesante de la semana', 'ok'],
        invalida: ['El enlace de confirmación no es válido o ha caducado. Vuelve a suscribirte', 'error'],
        error: ['No hemos podido confirmar la suscripción. Inténtalo de nuevo en unos minutos', 'error']
    }

    /* Escribimos el año actual en el copyright */
    anio.textContent = new Date().getFullYear()

    /* Enviamos la suscripción a la API: llega un correo para confirmarla (doble confirmación) */
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const email = newsletterEmail.value.trim()
        if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
            newsletterEmail.focus()
            return toast('Introduce un email válido', 'error')
        }
        if (!newsletterConsentimiento.checked) {
            newsletterConsentimiento.focus()
            return toast('Para suscribirte tienes que aceptar la política de privacidad', 'error')
        }

        newsletterBoton.disabled = true
        api.suscripciones.crear({ email, consentimiento: true, web: newsletterWeb.value })
            .then(() => {
                newsletterForm.reset()
                toast('¡Casi listo! Revisa tu correo y confirma la suscripción')
            })
            .catch((error) => toast(error.message, 'error'))
            .finally(() => { newsletterBoton.disabled = false })
    })

    /* Avisos al volver del correo de confirmación; quitamos el parámetro para que no se repita al recargar */
    const suscripcion = params.get('suscripcion')
    if (AVISOS[suscripcion]) {
        toast(...AVISOS[suscripcion])
        params.delete('suscripcion')
        history.replaceState(null, '', location.pathname + (params.toString() ? `?${params}` : '') + location.hash)
    }

    /* Desde el correo de agradecimiento (?suscribirse=1#newsletter) llevamos al formulario.
       Esperamos a que cargue la página: al procesar el ancla #newsletter el navegador quitaría el foco */
    if (params.get('suscribirse')) {
        const bloque = document.querySelector('#newsletter')
        const centrar = () => bloque.scrollIntoView({ block: 'center' })

        /* La portada sigue pintando filas de películas después de cargar: mientras la página cambie de alto
           (como mucho 4 segundos y hasta que el usuario mueva la página) volvemos a centrar el formulario */
        const observador = new ResizeObserver(centrar)
        const parar = () => observador.disconnect()
        observador.observe(document.body)
        setTimeout(parar, 4000)
        window.addEventListener('wheel', parar, { once: true, passive: true })
        window.addEventListener('touchstart', parar, { once: true, passive: true })

        window.addEventListener('load', () => setTimeout(() => {
            centrar()
            newsletterEmail.focus({ preventScroll: true })
        }, 0))
    }

})()
