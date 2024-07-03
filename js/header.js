

    const header = document.querySelector(`.Header`)
    const headerIcon = header.querySelector(`.Header-icon`)
    const headerClose = header.querySelector(`.Header-icon--close`)
    const headerUl = header.querySelector(`.Header-ul`)
    const headerAHover = header.querySelector(`.Header-a--hover`)
    const headerSearch = document.querySelector(`.Header-search`)
    const headerInput = headerSearch.querySelector(`.Header-input`)
    const suggestionList = headerSearch.querySelector(`.Header-ulsearch`)


   /*NAV BAR*/ 

   let menuOpen = false
        /* Hacemos una función handler de mouseover y mouseout 
        para aplicarlas posteriormente*/
        const handleMouseOver = (e, newClass) => {
            e.classList.add(newClass)
        }
    
        const handleMouseOut = (e, newClass) => {
            e.classList.remove(newClass)
        }


        const changeIcon = () => {
            if (menuOpen){
                headerIcon.classList.add('isHidden')
                headerClose.classList.remove('isHidden')
            } else {
                headerIcon.classList.remove('isHidden')
                headerClose.classList.add('isHidden')
            }

        }
    
        // Toggle isActive class on headerSvg hover
        headerIcon.addEventListener(`click` , () => {
          handleMouseOver(headerUl , `isActive`)
          menuOpen = true
          changeIcon()
        })

        headerClose.addEventListener(`click` , () => {
          handleMouseOut(headerUl , `isActive`) 
          menuOpen = false  
          changeIcon()
          })
    
        // Toggle show class on headerAHover hover
        if (headerAHover) {
            const menuUl = headerAHover.parentElement.querySelector('.Menu-ul');
            if (window.innerWidth <= 450) {
                // Toggle show class on click for mobile
                headerAHover.addEventListener(`click`, (event) => {
                    event.preventDefault(); // Prevent default link behavior
                    if (menuUl.classList.contains('show')) {
                        handleMouseOut(menuUl, `show`);
                    } else {
                        handleMouseOver(menuUl, `show`);
                    }
                });
            } else {
                // Toggle show class on hover for larger screens
                headerAHover.addEventListener(`mouseover`, () => handleMouseOver(menuUl, `show`));
                headerAHover.addEventListener(`mouseleave`, () => handleMouseOut(menuUl, `show`));
                menuUl.addEventListener(`mouseover`, () => handleMouseOver(menuUl, `show`));
                menuUl.addEventListener(`mouseleave`, () => handleMouseOut(menuUl, `show`));
            }
        }





        
  
// IFE que agrupa acción de buscar películas
        (() => {
           // Search field

    const movies = [
        { title: 'Bad Boys For Life', url: 'peliculas.html?nombre=Bad%20Boys%20for%20Life'},
        { title: 'Dune', url: 'peliculas.html?nombre=Dune'},
        { title: 'No Te Metas Con El Zohan', url: 'peliculas.html?nombre=No%20Te%20Metas%20Con%20El%20Zohan'},
        { title: 'Ant-Man And The Wasp: Quantumania', url: 'peliculas.html?nombre=Ant-Man%20And%20The%20Wasp:%20Quantumania'},
        { title: 'Godzilla Vs. Kong', url: 'peliculas.html?nombre=Godzilla%20Vs.%20Kong'},
        { title: '¿Y Dónde Están Las Rubias?', url: 'peliculas.html?nombre=%C2%BFY%20D%C3%B3nde%20Est%C3%A1n%20Las%20Rubias?'}
        
    ]

    headerInput.addEventListener('input' , function() {
        const text = headerInput.value.trim().toLowerCase()
        text.length > 0
        ? displaySuggestions( filterMovies(text))
        : suggestionList.innerHTML = ''
    })

    function filterMovies(text) {
        return movies.filter( movie => movie.title.toLocaleLowerCase().includes(text))
    }
    
    const suggestionItem = ({ title , url}) => {
        const li = document.createElement('li')
        li.textContent = title
        li.onclick = () => window.location.href = url
        return li
    }

   const displaySuggestions = suggestions => {
        suggestionList.innerHTML = ''
        suggestions.forEach(sugestion => suggestionList.appendChild(suggestionItem(sugestion)))
    }
        })()




