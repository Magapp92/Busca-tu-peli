

const sliderImgs = document.querySelectorAll(`.Slider-img`)
const mainSlider = document.querySelector(`.Main-slider`)
const articles = document.querySelectorAll(`.Main-article, .Main-articleReverse`)
const mainCarrousel = document.querySelector(`.Main-carrousel`)
const innerCarrousel = mainCarrousel.querySelector(`.Main-innerCarrousel`)
const mainWrapper = mainCarrousel.querySelector(`.Main-wrapper`)
const wrapperImgs = Array.from(mainWrapper.children)
const mainBtns = mainCarrousel.querySelectorAll(`.Main-button`)
const buttonNext = document.querySelector(`.Main-button--next`)
const buttonPrev = document.querySelector(`.Main-button--prev`)

/*Slider .Main-top*/

let anchoImagenes = 100 / sliderImgs.length
let contador = 0
let automatico

// IIFE que agrupa efectos slider
(() => {

  /*Permite mover horizontalmente el slider según el valor de la variable contador y el tamaño de las imágenes*/
  const sliderTranslate = () => {
    mainSlider.style.transform = `translateX(-${anchoImagenes * contador}%)`/*Cambiamos con style la propiedad transform del slider*/
  }

  const siguiente = () => {
    mainSlider.classList.add('withTransition'); /*Añadimos a Main-slider la clase withTransition que suaviza el movimiento*/
    contador++ /*Incrementamos la variable contador para que pase a la siguiente imagen*/
    if (contador == 5) { // <--- Cambiar 5 por sliderImgs.length para mayor flexibilidad
      setTimeout(() => {
        contador = 0
        sliderTranslate()
        mainSlider.classList.remove('withTransition')
      }, 1000) /*Cuando lleguemos a la imagen 5 reiniciamos la variable contador y le quitamos la clase withTransition a .Main-slider*/
    }
    sliderTranslate()
  }

  automatico = setInterval(siguiente, 4000)

})();

/*Carrousel populares*/

let currentIndex = 0

const gapWidth = 6

const getSlidesToShow = () => {
  const windowWidth = window.innerWidth
  if (windowWidth >= 2200) return 7
  if (windowWidth >= 1600) return 5
  if (windowWidth >= 1500) return 4
  if (windowWidth >= 1100) return 3
  if (windowWidth >= 600) return 2
  return 1
}

const updateSlidePosition = () => {
  const slideWidth = 300
  const totalWidth = slideWidth + gapWidth
  const slidesToShow = getSlidesToShow()
  const maxTranslateX = totalWidth * (wrapperImgs.length - slidesToShow)
  let translateX = currentIndex * totalWidth

  if (translateX > maxTranslateX) {
    translateX = maxTranslateX
  }

  innerCarrousel.style.transform = `translateX(-${translateX}px)`
}

const checkButtons = () => {
  const slidesToShow = getSlidesToShow()
  if (buttonPrev) buttonPrev.style.display = currentIndex === 0 ? 'none' : 'block'
  if (buttonNext) buttonNext.style.display = currentIndex >= wrapperImgs.length - slidesToShow ? 'none' : 'block'
}

const nextSlide = () => {
  const slidesToShow = getSlidesToShow()
  if (currentIndex < wrapperImgs.length - slidesToShow) {
    currentIndex++
    updateSlidePosition()
    checkButtons()
  }
}

const prevSlide = () => {
  if (currentIndex > 0) {
    currentIndex--
    updateSlidePosition()
    checkButtons()
  }
}

buttonNext.addEventListener('click', nextSlide)
buttonPrev.addEventListener('click', prevSlide)

const adjustSlideWidth = () => {
  const slidesToShow = getSlidesToShow()
  const slideWidth = 300
  const totalWidth = slideWidth + gapWidth
  const totalVisibleWidth = totalWidth * slidesToShow
  mainCarrousel.style.width = `${totalVisibleWidth}px`
  wrapperImgs.forEach(slide => {
    slide.style.width = `${slideWidth}px`
    slide.style.marginRight = `${gapWidth}px`
  })
  innerCarrousel.style.width = `${totalWidth * wrapperImgs.length}px`
  updateSlidePosition()
  checkButtons()
}

window.addEventListener('resize', adjustSlideWidth)
adjustSlideWidth()
checkButtons()




 /*Noticias*/

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




