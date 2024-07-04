

const sliderImgs = document.querySelectorAll(`.Slider-img`)
const mainSlider = document.querySelector(`.Main-slider`)
const articles = document.querySelectorAll(`.Main-article , .Main-articlereverse`)
const mainCarrousel = document.querySelector(`.Main-carrousel`)
const innerCarrousel = mainCarrousel.querySelector(`.Main-innercarrousel`)
const mainWrapper = mainCarrousel.querySelector(`.Main-wrapper`)
const wrapperImgs = mainCarrousel.querySelectorAll(`.Main-wrapperimg`)
const mainBtns = mainCarrousel.querySelectorAll(`.Main-button`)
const buttonNext = mainCarrousel.querySelector(`.Main-button--next`)
const buttonPrev = mainCarrousel.querySelector(`.Main-button--prev`)



/*Slider .Main-top*/

let anchoImagenes = 100 / sliderImgs.length
let contador = 0
let automatico

// IFE que agrupa efectos slider
(()=> {
    const sliderTranslate = ()=>{
     mainSlider.style.transform =`translateX(-${anchoImagenes * contador}%)`
}

const siguiente = ()=>{
    mainSlider.classList.add('withTransition')
    contador++
    if( contador == 5 ){
        setTimeout(()=>{
            contador = 0
            sliderTranslate()
            mainSlider.classList.remove('withTransition')
        } , 1000)
    }
    sliderTranslate()
}
const anterior = ()=>{
    contador--
    if( contador < 0 ){
        contador = 4
    }
    sliderTranslate()
}
const sliderOver = ()=>{
    clearInterval( automatico )
}
const sliderOut =  ()=>{
    automatico = setInterval( siguiente , 4000)
}

automatico = setInterval( siguiente , 4000)

})()


/*Carrousel populares*/

let index = 0
let amount = 10 
let currTransl = [ ] // Array contiene posiciones actuales de cada elemento
let translationComplete = true // Indica si la transición se ha completado

const transitionCompleted = function() {
    translationComplete = true // Indica que la transición se ha hecho
}
    amount = wrapperImgs.length
    moveOffset = document.querySelector('.Main-carrousel').offsetWidth / 5 // Calcular lo que se desplaza cada elemento teniendo en cuenta que deben ser 5 en pantalla
    mainWrapper.style.width = (amount * moveOffset) + 'px' // Nos da un ancho para el carrousel

    // Inicia el movimiento y añade evento a cada elemento transitionCompleted
    for (let i = 0; i < amount; i++) {
        currTransl[i] = -moveOffset
        wrapperImgs[i].addEventListener("transitionend", transitionCompleted, true)
    }

    // Posiciona último elemento al principio para continuar el ciclo
    mainWrapper.insertBefore(mainWrapper.children[amount - 1], mainWrapper.children[0])

    // Añadeimos el click a los botones next y prev
    document.querySelector('.Main-button--prev').addEventListener('click', prev, true)
    document.querySelector('.Main-button--next').addEventListener('click', next, true)


// Función para mover el carrusel hacia la izquierda

function prev() {  if (translationComplete) { 
        translationComplete = false
        const outerIndex = index % amount
        index++
        // Mueve cada elemento del carrousel
        for (let i = 0; i < amount; i++) {
            const poster = document.querySelectorAll('.Main-wrapperimg')[i]
            poster.style.opacity = '1'
            poster.style.transform = 'translateX(' + (currTransl[i] - moveOffset) + 'px)'
            currTransl[i] -= moveOffset
        }
    
        const posterExt = document.querySelectorAll('.Main-wrapperimg')[outerIndex]
        posterExt.style.transform = 'translateX(' + (currTransl[outerIndex] + (moveOffset * amount)) + 'px)'
        posterExt.style.opacity = '0'
        currTransl[outerIndex] += moveOffset * amount
    }
}
// Función para mover el carrusel hacia la derecha

function next() {if (translationComplete) { // Para desplazar el elemento debe haber sido completada transición anterior
    translationComplete = false
    index--
    if (index === -1) { // Si el índice es -1 volvemos al elemento anterior
        index = amount - 1
    }
    const outerIndex = index % amount // Calcula posición haciendo que haga un loop
    
    for (let i = 0; i < amount; i++) {
        const poster = document.querySelectorAll('.Main-wrapperimg')[i]
        poster.style.opacity = '1' // Devuelve la opacidad
        poster.style.transform = 'translateX(' + (currTransl[i] + moveOffset) + 'px)' // Mueve el elemento correspondiente
        currTransl[i] += moveOffset // Actualiza la posición 
    }
    // Indicamos el movimiento del elemento exterior y lo ocultamos
    const posterExt = document.querySelectorAll('.Main-wrapperimg')[outerIndex]
    posterExt.style.transform = 'translateX(' + (currTransl[outerIndex] - (moveOffset * amount)) + 'px)'
    posterExt.style.opacity = '0'
    currTransl[outerIndex] -= moveOffset * amount
}
}


// IFE que agrupa efecto noticias
(()=> {
    /*Noticias y articles*/

const user = new IntersectionObserver( e => {
    e.forEach( _ =>{
        if ( _ .isIntersecting){
            articles.forEach((article , index) =>{
                setTimeout(() => {
                    article.classList.add('visible')
                    article.classList.remove('hidden')
                }, index * 800);
            })
        }else{
            articles.forEach(article => {
                article.classList.remove('visible')
                article.classList.add('hidden')
            })
        }
    })
}, {threshold: 0.1} ) /*El callback se ejecutará cuando al menos el 10% de los articles sean visibles en la ventana*/

user.observe(document.querySelector(`.Main-noticias`))
})()


