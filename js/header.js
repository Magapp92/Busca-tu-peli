
/*Creamos las constantes que vamos a utilizar*/

    const header = document.querySelector(`.Header`)
    const headerIcon = header.querySelector(`.Header-icon`)
    const headerClose = header.querySelector(`.Header-icon--close`)
    const headerUl = header.querySelector(`.Header-ul`)
    const headerSpan = header.querySelector(`.Header-span`)
    const headerSearch = document.querySelector(`.Header-search`)
    const headerInput = headerSearch.querySelector(`.Header-input`)
    const suggestionList = headerSearch.querySelector(`.Header-ulsearch`)


/*NAV BAR*/ 

   /*Creamos variable menuOpen con el estado false*/
   let menuOpen = false

   /*Creamos funciones handler de mouseover y mouseout*/
   const handlerMouseOver = (e, newClass) => {
       e.classList.add(newClass)
   }

   const handlerMouseOut = (e, newClass) => {
       e.classList.remove(newClass)
   }

// IFE que agrupa funciones sobre .Menu-ul, Header-icon y Header-icon--close
   (() => {

   /*Creamos una condicional en la que si menuOpen o no le add y remove la clase isHidden a Header-icon y Header-icon--close*/
   const changeIcon = () => {
       if (menuOpen){
           headerIcon.classList.add(`isHidden`)
           headerClose.classList.remove(`isHidden`)
       } else {
           headerIcon.classList.remove(`isHidden`)
           headerClose.classList.add(`isHidden`)
       }
   }

   /*A Header-icon le add evento de click, con la función callback llamamos a la función de MouseOver donde cambiamos el 
   estado a true y llamamos a la función changeIcon */
   headerIcon.addEventListener(`click` , () => {
     handlerMouseOver(headerUl , `isActive`)
     menuOpen = true
     changeIcon()
   })

   /*Hacemos lo mismo que en el caso anterior solo que ahora volvemos a menuOpen a su estado inicial false*/
   headerClose.addEventListener(`click` , () => {
     handlerMouseOut(headerUl , `isActive`) 
     menuOpen = false  
     changeIcon()
     })

   /*Si headerSpan existe, entonces seleccionamos a .Menu-ul, aplicamos una condicional para distinguir entre
   diferentes tamaños de pantalla para que si esta es <= a 930px el hover pase a click, creamos condicional en la que 
   si .Menu-ul ya tiene la clase show llamamos a handlerMouseOut para quitarla, y si no se llama a handlerMouseOver para añadirla   */
   if (headerSpan) {
       const menuUl = headerSpan.parentElement.querySelector(`.Menu-ul`)
       if (window.innerWidth <= 930) {
            headerSpan.addEventListener(`click`, (event) => {
            event.preventDefault()
       if (menuUl.classList.contains(`show`)) {
            handlerMouseOut(menuUl, `show`)
       } else {
            handlerMouseOver(menuUl, `show`)
       }
    })
       } else {
           /*Para pantallas > a 930px se añaden y quitan eventos de mouseover y mouseleave*/
           headerSpan.addEventListener(`mouseover`, () => handlerMouseOver(menuUl, `show`))/*Cuando estamos en mouseover llamaos handlerMouseOver y le añadimos la clase show a .Menu-ul*/
           headerSpan.addEventListener(`mouseleave`, () => handlerMouseOut(menuUl, `show`))/*Cuando estamos en mouseleave llamamos a handlerMouseOut y le quitamos show a .Menu-ul*/
           menuUl.addEventListener(`mouseover`, () => handlerMouseOver(menuUl, `show`))/*Mientras estemos en mouseover la clase show se aplicará en .Menu-ul*/
           menuUl.addEventListener(`mouseleave`, () => handlerMouseOut(menuUl, `show`))/*Cuando estemos en mouseleave dejará de aplicarse show*/
       }
   }

    })()
        


/*BÚSQUEDA HEADER SEARCH*/

/* Aquí se agrupa el array que contiene la constante movies con todos los títulos de las películas y el enlace que te redirige a cada una */
    const movies = [
     { title: 'Bad Boys For Life', url: 'peliculas.html?nombre=Bad%20Boys%20for%20Life'},
     { title: 'Dune', url: 'peliculas.html?nombre=Dune'},
     { title: 'No Te Metas Con El Zohan', url: 'peliculas.html?nombre=No%20Te%20Metas%20Con%20El%20Zohan'},
     { title: 'Ant-Man And The Wasp: Quantumania', url: 'peliculas.html?nombre=Ant-Man%20And%20The%20Wasp:%20Quantumania'},
     { title: 'Godzilla Vs. Kong', url: 'peliculas.html?nombre=Godzilla%20Vs.%20Kong'},
     { title: '¿Y Dónde Están Las Rubias?', url: 'peliculas.html?nombre=%C2%BFY%20D%C3%B3nde%20Est%C3%A1n%20Las%20Rubias?'},
     { title: '50 Primeras Citas', url: 'peliculas.html?nombre=50%20Primeras%20Citas'},
     { title: 'Society Of Snow', url: 'peliculas.html?nombre=Society%20Of%20Snow'},
     { title: 'Siempre A Tu Lado', url: 'peliculas.html?nombre=Siempre%20A%20Tu%20Lado'},
     { title: 'El Aro', url: 'peliculas.html?nombre=El%20Aro'},
     { title: 'Escuadrón Maldito', url: 'peliculas.html?nombre=Escuadr%C3%B3n%20Maldito'},
     { title: 'Hombres De Honor', url: 'peliculas.html?nombre=Hombres%20De%20Honor'},
     { title: 'Tienes Un Email', url: 'peliculas.html?nombre=Tienes%20Un%20Email'},
     { title: 'Expediente Warren', url: 'peliculas.html?nombre=Expediente%20Warren'},
     { title: 'Mrs. Doubtfire', url: 'peliculas.html?nombre=Mrs.%20Doubtfire'},
     { title: 'Poor Things', url: 'peliculas.html?nombre=Poor%20Things'},
     { title: 'Pearl Harbor', url: 'peliculas.html?nombre=Pearl%20Harbor'},
     { title: 'Rec', url: 'peliculas.html?nombre=Rec'},
     { title: 'si señor', url: 'peliculas.html?nombre=%C2%A1S%C3%AD%20Se%C3%B1or!'},
     { title: 'American History X', url: 'peliculas.html?nombre=American%20History%20X'},
     { title: 'Crazy Stupid Love', url: 'peliculas.html?nombre=Crazy%20Stupid%20Love'},
     { title: 'La Monja', url: 'peliculas.html?nombre=La%20Monja'},
     { title: 'Come, Reza, Ama', url: 'peliculas.html?nombre=Come,%20Reza,%20Ama'},
     { title: 'Smile', url: 'peliculas.html?nombre=Smile'},
     { title: 'Los Puentes De Madison', url: 'peliculas.html?nombre=Los%20Puentes%20De%20Madison'},
     { title: 'The Bloody Hundredth', url: 'peliculas.html?nombre=The%20Bloody%20Hundredth'}
 ]


    /*Añadimos a .Header-input el evento de input que se ejecuta al escribir en el campo correspondiente*/
    headerInput.addEventListener('input' , function() {
        const text = headerInput.value.trim().toLowerCase() /*Convertimos el texto escrito a minúscula y eliminamos espacios*/
        text.length > 0 /*Si el texto tiene valor >0 entonces se filtran las películas que coinciden con el texto y se muestran las sugerencias con displaySuggestions*/
        ? displaySuggestions( filterMovies(text))
        : suggestionList.innerHTML = '' /*Si no hay texto no aparece la lista de sugerencias*/
    })

    /*Filtra la lista de películas con el texto escrito y muestra las que tengan coincidencia con .movie.title no teniendo en cuenta entre mayúsculas y minúsculas*/
    function filterMovies(text) {
        return movies.filter( movie => movie.title.toLocaleLowerCase().includes(text))
    }
    
    const suggestionItem = ({ title , url}) => {
        const li = document.createElement('li') /*Se crea un li para la sugerencia*/
        li.textContent = title /*Indicamos que el texto escrito es el title*/
        li.onclick = () => window.location.href = url /*Le añadimos onclick para que al hacer click nos dirija a la url correspondiente*/
        return li
    }

   const displaySuggestions = suggestions => {
        suggestionList.innerHTML = '' /*Si el campo está vacío no aparecen sugerencias*/
        suggestions.forEach(sugestion => suggestionList.appendChild(suggestionItem(sugestion))) /*Recorre sugestion creando un nuevo elemento para cada sugerencia
         y lo incluye en suggestionList*/
    }
   





