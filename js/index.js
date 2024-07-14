

const sliderImgs = document.querySelectorAll(`.Slider-img`)
const mainSlider = document.querySelector(`.Main-slider`)
const articles = document.querySelectorAll(`.Main-article, .Main-articleReverse`)
const mainCarrousel = document.querySelector(`.Main-carrousel`)
const innerCarrousel = mainCarrousel.querySelector(`.Main-innerCarrousel`)
const mainWrapper = mainCarrousel.querySelector(`.Main-wrapper`)
const wrapperImgs = mainCarrousel.querySelectorAll(`.Main-wrapperImg`)
const mainBtns = mainCarrousel.querySelectorAll(`.Main-button`)
const buttonNext = document.querySelector(`.Main-button--next`)
const buttonPrev = document.querySelector(`.Main-button--prev`)



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

let initialIndex = 0 //Indice inicial

const updateImgPosition = () => { //Funcion para actualizar la posicion de las imagenes del carrusel
  const slideWidth = wrapperImgs[0].offsetWidth //Calculo el ancho de cada poster
  const maxTranslateX = slideWidth * (wrapperImgs.length - 1)//calculo el maximo desplazamiento posible en x
  const translateX = Math.min(initialIndex * slideWidth, maxTranslateX)//Limito el desplazamiento en x del valor calculado

  
  const margin = 30 //Declaro una variable para gregar un margen adicional que se aplica al desplazamiento de los poster
  const adjustedTranslateX = Math.min(translateX + margin, maxTranslateX)//ajusto la posicion del desplazamiento en x 

  innerCarrousel.style.transform = `translateX(-${adjustedTranslateX}px)`//aplico el desplazamiento al elemento que contiene las imagenes de los poster
}

const checkButtons = () => {//Funcion que verifica la visibilidad de los botones next y prev ajustando su opacidad segun el caso 
    const slidesToShow = window.innerWidth >= 1024 ? 5 : window.innerWidth >= 600 ? 3 : 1
    buttonPrev.style.opacity = initialIndex === 0 ? '0' : '1'
    buttonNext.style.opacity = initialIndex >= wrapperImgs.length - slidesToShow ? '0' : '1'
  }
  

const nextSlide = () => {//Funcion para avanzar al siguiente poster 
  const slidesToShow = window.innerWidth >= 1024 ? 5 : window.innerWidth >= 600 ? 3 : 1
  if (initialIndex < wrapperImgs.length - slidesToShow) {
    initialIndex++
    updateImgPosition()
    checkButtons()//visibilidad del boton next
  }
}

const prevSlide = () => {//Funcion para retroceder
  if (initialIndex > 0) {
    initialIndex--
    updateImgPosition()
    checkButtons()//visibilidad del boton prev
  }
}

buttonNext.addEventListener('click', nextSlide)//Escucha el evento click para el boton next y llama a nextSlide
buttonPrev.addEventListener('click', prevSlide)//Escucha el evento click para el boton prev y llama a prevSlide

const adjustSlideWidth = () => {//Funcion que determina cuantas imagenes de poster mostrar por ancho de pantallla
  let slidesToShow
  if (window.innerWidth >= 1500) {
    slidesToShow = 5
  } else if (window.innerWidth >= 600) {
    slidesToShow = 3
  } else {
    slidesToShow = 1
  }

  const slideWidth = mainCarrousel.offsetWidth / slidesToShow // Constante que calcula el ancho de cada imagen de poster segun el numero de posters a mostrar
  wrapperImgs.forEach(slide => {// Ajusta el ancho y la altura máxima de cada imagen de poster 
    slide.style.width = `${slideWidth}px`
    slide.style.maxHeight = `${mainCarrousel.offsetHeight}px`
  })
  innerCarrousel.style.width = `${slideWidth * wrapperImgs.length}px`//// Ajusta el ancho del contenedor interno que contiene los poster
  // Actualiza la posición del poster mostrado y verifica la visibilidad de los botones
  updateImgPosition()
  checkButtons()
}

window.addEventListener('resize', adjustSlideWidth)// Escucha el evento de cambio de tamaño de ventana para ajustar el ancho de los poster
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




