

const sliderImgs = document.querySelectorAll(`.Slider-img`)
const mainSlider = document.querySelector(`.Main-slider`)
const articles = document.querySelectorAll(`.Main-article, .Main-articleReverse`)
const mainCarrousel = document.querySelector(`.Main-carrousel`)
const innerCarrousel = mainCarrousel.querySelector(`.Main-innerCarrousel`)
const mainWrapper = mainCarrousel.querySelector(`.Main-wrapper`)
const wrapperImgs = mainCarrousel.querySelectorAll(`.Main-wrapperImg`)
const mainBtns = mainCarrousel.querySelectorAll(`.Main-button`)
const buttonNext = mainCarrousel.querySelector(`.Main-button--next`)
const buttonPrev = mainCarrousel.querySelector(`.Main-button--prev`)



/*Slider .Main-top*/

let anchoImagenes = 100 / sliderImgs.length
let contador = 0
let automatico

// IFE que agrupa efectos slider
(()=> {

    /*Permite mover horizontalmente el slider según el valor de la variable contador y el tamaño de las imágenes*/
    const sliderTranslate = ()=>{
    mainSlider.style.transform =`translateX(-${anchoImagenes * contador}%)` /*Cambiamos con style la propiedad transform del slider*/
}

const siguiente = ()=>{
    mainSlider.classList.add('withTransition') /*Añadimos a Main-slider la clase withTransition que suaviza el movimiento*/
    contador++ /*Incrementamos la variable contador para que pase a la siguiente imágen*/
    if( contador == 5 ){
        setTimeout(()=>{
         contador = 0
         sliderTranslate()
         mainSlider.classList.remove('withTransition')
        } , 1000) /*Cuando lleguemos a la imágen 5 reiniciamos la variable contador y le quitamos la clase withTransition a .Main-slider*/
    }
    sliderTranslate()
}

automatico = setInterval( siguiente , 4000)

})()


/*Carrousel populares*/

let currentIndex = 5
const slidesToShow = 11
const totalSlides = wrapperImgs.length
const slideWidth = mainCarrousel.offsetWidth / slidesToShow

// Adjust totalSlides to include the cloned elements
const totalSlidesWithClones = totalSlides + slidesToShow * 11 

// Duplicate first few elements to create the infinite effect
for (let i = 0; i < slidesToShow; i++) {
    let firstClone = wrapperImgs[i].cloneNode(true)
    let lastClone = wrapperImgs[totalSlides - 1 - i].cloneNode(true)
    mainWrapper.appendChild(firstClone)
    mainWrapper.insertBefore(lastClone, mainWrapper.firstChild)
}



const updateSlidePosition = () => {
    innerCarrousel.style.transform = `translateX(-${currentIndex * slideWidth}px)`
}

const smoothTransition = () => {
    innerCarrousel.style.transition = 'transform 0.6s ease'
}

const noTransition = () => {
    innerCarrousel.style.transition = 'none'
}

const nextSlide = () => {
    currentIndex++
    smoothTransition()
    updateSlidePosition()
    if (currentIndex >= totalSlides + slidesToShow) {
        setTimeout(() => {
            noTransition()
            currentIndex = slidesToShow;
            updateSlidePosition()
        }, 500)
    }
};

const prevSlide = () => {
    currentIndex--
    smoothTransition()
    updateSlidePosition()
    if (currentIndex <= 0) {
        setTimeout(() => {
            noTransition()
            currentIndex = totalSlides
            updateSlidePosition()
        }, 500)
    }
};

buttonNext.addEventListener('click', nextSlide)
buttonPrev.addEventListener('click', prevSlide)

// Start at one clone offset
currentIndex = slidesToShow
noTransition()
updateSlidePosition()


 /*Noticias y articles*/



/*Creamos el intersectionObserver y creamos un callback en el que recorremos cada elemento en pantalla, si el elemento es visible en pantalla,
para cada article se add y remove las clases visible y hidden correspondientemente en cada caso para que aparezcan con un cierto retraso para cada article*/
const user = new IntersectionObserver( e => {
 e.forEach( _ => {
     if ( _ .isIntersecting) {
        articles.forEach((article , index) =>{
         setTimeout(() => {
          article.classList.add('visible')
          article.classList.remove('hidden')
         }, index * 900)
        })
    } else{
        articles.forEach( article => {
          article.classList.remove('visible')
          article.classList.add('hidden')
        })
    }
 })
}, {threshold: 0.1} ) /*Indicamos que el callback se ejecute cuando al menos el 10% de los articles sean visibles en la ventana*/

user.observe(document.querySelector(`.Main-noticias`))




