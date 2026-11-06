/* Comportamiento del footer que está escrito en cada página: año actual y formulario de novedades */

// IIFE que agrupa el footer para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const anio = document.querySelector('[data-element="anio"]')
    const newsletterForm = document.querySelector('.Footer-form')
    const newsletterInput = newsletterForm.querySelector('input')

    /* Escribimos el año actual en el copyright */
    anio.textContent = new Date().getFullYear()

    /* Validamos el email; si es correcto vaciamos el campo y damos las gracias */
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault()
        if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(newsletterInput.value.trim())) return toast('Introduce un email válido', 'error')
        newsletterInput.value = ''
        toast('¡Listo! Te avisaremos de las novedades')
    })

})()
