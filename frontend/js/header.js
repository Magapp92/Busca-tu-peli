/* Comportamiento del header que está escrito en cada página:
   fondo sólido al hacer scroll, menú hamburguesa en móvil y buscador con sugerencias desde la API */

// IIFE que agrupa todo el header para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const header = document.querySelector('[data-element="header"]')
    const menuButton = header.querySelector('.Header-menuButton')
    const nav = header.querySelector('#nav')
    const searchInput = header.querySelector('.Search-input')
    const searchList = header.querySelector('#search-results')


    /* HEADER SÓLIDO */

    /* Al bajar 24px (o si la página lo pide con data-solid-header) el header pasa a tener fondo */
    const ponerSolido = () => {
        header.classList.toggle('isSolid', window.scrollY > 24 || document.body.dataset.solidHeader === 'true')
    }
    ponerSolido()
    window.addEventListener('scroll', ponerSolido, { passive: true })


    /* MENÚ HAMBURGUESA */

    /* Abrimos y cerramos el nav cambiando el icono del botón entre hamburguesa y cerrar */
    menuButton.addEventListener('click', () => {
        const abierto = nav.classList.toggle('isOpen')
        menuButton.setAttribute('aria-expanded', abierto)
        menuButton.innerHTML = abierto ? ICON.close : ICON.menu
    })


    /* BUSCADOR */

    /* Sugerencias en vivo, navegación con flechas y Enter para ir al catálogo */
    let sugerencias = []
    let activa = -1

    const cerrarSugerencias = () => {
        searchList.classList.remove('isOpen')
        searchInput.setAttribute('aria-expanded', 'false')
        activa = -1
    }

    /* Marcamos la sugerencia elegida con las flechas */
    const marcarSugerencia = () => {
        searchList.querySelectorAll('.Search-item').forEach((el, i) => el.classList.toggle('isActive', i === activa))
    }

    const pintarSugerencias = (q) => {
        searchList.innerHTML = sugerencias.length
            ? sugerencias.map((p, i) => `
                <a class="Search-item" role="option" id="sug-${i}" href="${urlPelicula(p)}">
                    <img src="${esc(p.poster)}" alt="">
                    <div><strong>${esc(p.titulo)}</strong><span>${esc(p.anio)} · ${esc((p.generos || []).slice(0, 2).join(', '))}</span></div>
                </a>`).join('') + `<a class="Search-all" href="catalogo.html?q=${encodeURIComponent(q)}">Ver todos los resultados</a>`
            : `<p class="Search-empty">Sin resultados para “${esc(q)}”</p>`
        searchList.classList.add('isOpen')
        searchInput.setAttribute('aria-expanded', 'true')
    }

    /* Pedimos a la API como mucho 6 películas; solo pintamos si el texto no ha cambiado mientras tanto */
    const buscarSugerencias = debounce((q) => {
        api.peliculas.listar({ q, limite: 6 })
            .then((pelis) => {
                sugerencias = pelis
                if (searchInput.value.trim() === q) pintarSugerencias(q)
            })
            .catch((error) => toast(error.message, 'error'))
    }, 220)

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim()
        q.length >= 2 ? buscarSugerencias(q) : cerrarSugerencias()
    })

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && sugerencias.length) { e.preventDefault(); activa = (activa + 1) % sugerencias.length; marcarSugerencia() }
        if (e.key === 'ArrowUp' && sugerencias.length) { e.preventDefault(); activa = (activa - 1 + sugerencias.length) % sugerencias.length; marcarSugerencia() }
        if (e.key === 'Escape') { cerrarSugerencias(); searchInput.blur() }
        if (e.key === 'Enter') {
            e.preventDefault()
            const q = searchInput.value.trim()
            if (activa >= 0 && sugerencias[activa]) location.href = urlPelicula(sugerencias[activa])
            else if (q) location.href = `catalogo.html?q=${encodeURIComponent(q)}`
        }
    })

    /* Cerramos las sugerencias al hacer clic fuera del buscador */
    document.addEventListener('click', (e) => { if (!e.target.closest('.Search')) cerrarSugerencias() })

    /* Atajo "/" para enfocar el buscador */
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            e.preventDefault()
            searchInput.focus()
        }
    })

})()
