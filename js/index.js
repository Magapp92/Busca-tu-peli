

const sliderImgs = document.querySelectorAll(`.Slider-img`)
const mainSlider = document.querySelector(`.Main-slider`)
const articles = document.querySelectorAll(`.Main-article, .Main-articleReverse`)
const mainCarrousel = document.querySelector(`.Main-carrousel`)
const prevButton = document.querySelector('.Main-button--prev')
const nextButton = document.querySelector('.Main-button--next')
const carouselInner = document.querySelector('.Main-wrapper')
const blocks = document.querySelectorAll('.Main-block')
const slider = document.querySelector('.Main-carruselMobile')
const sliderContainer = slider.querySelector('.Main-mobileContainer')
const mobileImgs = slider.querySelectorAll('.Main-mobileImg')
const nextBtn = slider.querySelector('.Main-button--mobileNext')
const prevBtn = slider.querySelector('.Main-button--mobilePrev')


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

})()


/*Carrousel populares*/

  const totalBlocks = blocks.length
  let currentBlock = 0
  const blocksGap = 1

  /* Cálculo del tamaño por bloque y desplazamiento del carrusel */
  function updateCarousel() {
      const offset = -currentBlock * (100 + blocksGap)
      carouselInner.style.transform = `translateX(${offset}%)`
      
      /* Se muestran u ocultan los botones según la posición */
      prevButton.style.display = currentBlock === 0 ? 'none' : 'block'
      nextButton.style.display = currentBlock === totalBlocks - 1 ? 'none' : 'block'
  }

  function updateBlocks() {
      const width = window.innerWidth
      let itemsPerBlock
      
    if (width >= 2200) {
          itemsPerBlock = 7
      } else if (width >= 1900) {
        itemsPerBlock = 6
      }else if (width >= 1500) {
          itemsPerBlock = 5
      } else if (width >= 930) {
          itemsPerBlock = 4
      } else if (width >= 600) {
          itemsPerBlock = 3
      } else {
          itemsPerBlock = 1
      }

      blocks.forEach(block => {
          const images = Array.from(block.children)
          images.forEach(img => img.style.display = 'none')
          images.slice(0, itemsPerBlock).forEach(img => img.style.display = 'block')
      })
  }
 /* Se crea el movimiento del carrusel con el click */
  nextButton.addEventListener('click', function() {
      if (currentBlock < totalBlocks - 1) {
          currentBlock++
          updateCarousel()
      }
  })

  prevButton.addEventListener('click', function() {
      if (currentBlock > 0) {
          currentBlock--
          updateCarousel()
      }
  })

  window.addEventListener('resize', function() {
      updateBlocks()
      updateCarousel()
  })

  updateBlocks()
  updateCarousel()


// /* Creamos otro JS que maneja el carrusel de móvil que solo aparece en tamaños de pantalla =< a 600px */
/*Carrusel Modo Mobile*/
let index = 0

const updateSliderPosition = () => {
    sliderContainer.style.transform = `translateX(-${index * 100}%)`
    
    prevBtn.style.display = index === 0 ? 'none' : 'block'
    nextBtn.style.display = index === mobileImgs.length - 1 ? 'none' : 'block'
}
/* IFE que agrupa las funciones de movimiento de botones carrusel en móvil */
(() => {
nextBtn.addEventListener('click', () => {
    if (index < mobileImgs.length - 1) {
        index++
        updateSliderPosition()
    }
})

prevBtn.addEventListener('click', () => {
    if (index > 0) {
        index--
        updateSliderPosition()
    }
})

updateSliderPosition()

})()


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




