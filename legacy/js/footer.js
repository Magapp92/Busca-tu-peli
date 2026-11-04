
/*Creamos las constantes que necesitaremos para añadir el evento al formulario*/ 

const footer = document.querySelector(`.Footer`)
const footerForm = footer.querySelector(`.Footer-form`)
const footerInput = footer.querySelector(`.Footer-input`)

/*Creamos la función handler con la condicional para validar el correo*/
function handlerValidateEmail(e) {
    e.preventDefault()/*Cancela la ejecución y evita que se borre el campo en caso de errores*/

    let emailValue = footerInput.value /* variable nos da valor introducido en .Footer-input */

    /*Validamos el correo, si se cumple la condición lanzará mensaje agradecimiento, si  no se cumple, lanza un alert */
    if (validateEmail(emailValue)) {
        footerInput.value = ''
        alert('Gracias por suscribirte, te avisaremos de todas nuestras novedades.')
    } else {
        alert('Por favor, introduce un correo electrónico válido.')
    }
}

/*A .Footer-form le añadimos evento usando la función handler*/
footerForm.addEventListener('submit', handlerValidateEmail)

/*Creamos la función que valida que el correo tenga el formato correcto para hacer la llamada desde la función handler*/
function validateEmail(email) {
    let resp = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/
    return resp.test(email)
}
