

const footer = document.querySelector(`.Footer`)
const footerForm = footer.querySelector(`.Footer-form`)
const footerInput = footer.querySelector(`.Footer-input`)

footerForm.addEventListener('submit' , function(e) {
    e.preventDefault()

    let emailValue = footerInput.value

    if (validateEmail (emailValue)) {
        footerInput.value = ''
        alert('Gracias por suscribirte, te avisaremos de todas nuestras novedades.')
    } else {
        alert('Por favor, introduce un correo electrónico válido.')

    }
})

function validateEmail(email) {
    let resp = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/
    return resp.test(email)
}


