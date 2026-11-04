// Seleccionamos los elementos del nuevo formulario
const mainForm = document.querySelector('.Main-form')
const emailInput = mainForm.querySelector('#email') // Seleccionamos el input de email
const nameInput = mainForm.querySelector('#full-name') // Seleccionamos el input de nombre completo
const movieInput = mainForm.querySelector('#movie-title') // Seleccionamos el textarea de la película

/* Creamos la función handler con la condicional para validar el correo */
function handlerValidateEmail(e) {
    e.preventDefault() // Cancela la ejecución y evita que se borre el campo en caso de errores

    let emailValue = emailInput.value // Variable que nos da el valor introducido en el input de email

    /* Validamos el correo, si se cumple la condición lanzará mensaje de agradecimiento, si no se cumple, lanza un alert */
    if (validateEmail(emailValue)) {
        emailInput.value = ''
        nameInput.value = ''
        movieInput.value = ''
        alert('Gracias por tu sugerencia, te notificaremos cuando se añada a la plataforma.')
    } else {
        alert('Por favor, introduce un correo electrónico válido.')
    }
}

/* Añadimos el evento submit al formulario usando la función handler */
mainForm.addEventListener('submit', handlerValidateEmail)

/* Creamos la función que valida que el correo tenga el formato correcto para hacer la llamada desde la función handler */
function validateEmail(email) {
    let resp = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/
    return resp.test(email)
}
