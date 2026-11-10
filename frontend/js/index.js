/* Página de inicio: carrusel con las añadidas recientemente, plataformas, filas por género y noticias */

// IIFE que agrupa la página de inicio para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const hero = document.querySelector('[data-element="hero"]')
    const plataformasContainer = document.querySelector('[data-element="plataformas"]')
    const filasContainer = document.querySelector('[data-element="filas"]')
    const noticiasContainer = document.querySelector('[data-element="noticias"]')

    const HERO_MS = 3500
    const HERO_PELIS = 6
    /* Margen tras la primera imagen del carrusel antes de pedir lo que no se ve al entrar */
    const PAUSA_MS = 1000

    /* Cada fila hace su propia llamada filtrada a la API */
    const FILAS = [
        { titulo: 'Añadidas recientemente', sub: 'Lo último que ha llegado al catálogo', query: { orden: 'recientes', limite: 12, enStreaming: true }, link: 'catalogo.html?orden=recientes' },
        { titulo: 'Acción', query: { genero: 'Acción' }, link: 'catalogo.html?genero=Acción' },
        { titulo: 'Comedia', query: { genero: 'Comedia' }, link: 'catalogo.html?genero=Comedia' },
        { titulo: 'Drama', query: { genero: 'Drama' }, link: 'catalogo.html?genero=Drama' },
        { titulo: 'Romance', query: { genero: 'Romance' }, link: 'catalogo.html?genero=Romance' },
        { titulo: 'Terror', query: { genero: 'Terror' }, link: 'catalogo.html?genero=Terror' }
    ]

    /* Fondos de TMDB: el navegador elige el tamaño según la pantalla (w1280 hasta Full HD y el original en 2K, 4K y retina).
       Las diapositivas que no se ven al entrar llevan la imagen en data-src y se cargan después de la primera */
    const fuenteFondo = (url, diferida) => {
        const pre = diferida ? 'data-' : ''
        if (!/image\.tmdb\.org\/t\/p\/w\d+\//.test(url)) return `${pre}src="${esc(url)}"`
        const tam = (t) => esc(url.replace(/\/t\/p\/w\d+\//, `/t/p/${t}/`))
        return `${pre}src="${tam('w1280')}" ${pre}srcset="${tam('w780')} 780w, ${tam('w1280')} 1920w, ${tam('original')} 3840w" sizes="100vw"`
    }


    /* CARRUSEL (HERO) */

    /* Promesa que se cumple cuando la imagen termina de cargar, si falla o, como mucho, a los 3 segundos */
    const esperarImagen = (img) => new Promise((listo) => {
        if (!img || img.complete) return listo()
        img.addEventListener('load', listo, { once: true })
        img.addEventListener('error', listo, { once: true })
        setTimeout(listo, 3000)
    })

    /* Pintamos una diapositiva por película y los puntos para elegirlas */
    const pintarHero = (pelis) => {
        hero.style.setProperty('--hero-ms', `${HERO_MS}ms`)
        hero.innerHTML = pelis.map((p, i) => `
            <article class="Hero-slide${i === 0 ? ' isActive' : ''}" aria-roledescription="diapositiva" aria-label="${i + 1} de ${pelis.length}" ${i ? 'inert' : ''}>
                <img class="Hero-background" ${fuenteFondo(p.backdrop || p.poster, i > 0)} alt="" decoding="async" ${i ? '' : 'fetchpriority="high"'}>
                <div class="Hero-content Container">
                    <div class="Hero-inner">
                        <div class="Hero-eyebrow">
                            ${(p.plataformas || []).map((pl) => PLATAFORMAS[pl.clave] ? `<img class="Hero-platform" src="${PLATAFORMAS[pl.clave].logo}" alt="${PLATAFORMAS[pl.clave].nombre}">` : '').join('')}
                            <span class="Tag Tag--accent">Novedad</span>
                        </div>
                        <h2 class="Hero-title">${esc(p.titulo)}</h2>
                        <p class="Hero-meta"><span>${esc(p.anio)}</span><span>${duracion(p.duracionMin)}</span><span>${esc(p.generos.slice(0, 3).join(', '))}</span></p>
                        <p class="Hero-text">${esc(p.sinopsis)}</p>
                        <div class="Hero-actions">
                            <button class="Button Button--primary" data-trailer="${esc(p.trailer)}" data-titulo="${esc(p.titulo)}">${ICON.play} Ver tráiler</button>
                            <a class="Button Button--ghost" href="${urlPelicula(p)}">${ICON.info} Más información<span class="u-srOnly"> sobre ${esc(p.titulo)}</span></a>
                        </div>
                    </div>
                </div>
            </article>`).join('') + `
            <div class="Hero-dots" role="tablist" aria-label="Elegir película">
                ${pelis.map((p, i) => `<button class="Hero-dot${i === 0 ? ' isActive' : ''}" role="tab" aria-label="${esc(p.titulo)}" aria-selected="${i === 0}"></button>`).join('')}
            </div>`

        const slides = $$('.Hero-slide', hero)
        const dots = $$('.Hero-dot', hero)

        /* Ponemos la imagen de la diapositiva i si aún la tiene guardada en data-src */
        const cargarFondo = (i) => {
            const img = slides[i] && $('img[data-src]', slides[i])
            if (!img) return
            if (img.dataset.srcset) img.srcset = img.dataset.srcset
            img.src = img.dataset.src
            img.removeAttribute('data-src')
        }
        /* La segunda se pide un poco después de que se vea la primera; las demás, al llegar la anterior */
        esperarImagen($('.Hero-background', hero)).then(() => setTimeout(() => cargarFondo(1), PAUSA_MS))

        let actual = 0
        let automatico

        /* Pasamos a la diapositiva n (da la vuelta al llegar al final) */
        const ir = (n) => {
            slides[actual].classList.remove('isActive')
            slides[actual].inert = true
            dots[actual].classList.remove('isActive')
            dots[actual].setAttribute('aria-selected', 'false')
            actual = (n + slides.length) % slides.length
            slides[actual].classList.add('isActive')
            slides[actual].inert = false
            cargarFondo(actual)
            cargarFondo((actual + 1) % slides.length)
            /* Reiniciamos la animación de la barra de progreso */
            void dots[actual].offsetWidth
            dots[actual].classList.add('isActive')
            dots[actual].setAttribute('aria-selected', 'true')
        }
        const arrancar = () => { clearInterval(automatico); automatico = setInterval(() => ir(actual + 1), HERO_MS) }

        dots.forEach((d, i) => d.addEventListener('click', () => { ir(i); arrancar() }))
        /* Pausa al pasar el ratón; en pantallas táctiles no (el toque no tiene "salir" y quedaría parado) */
        hero.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { clearInterval(automatico); hero.classList.add('isPaused') } })
        hero.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hero.classList.remove('isPaused'); arrancar() } })

        /* Deslizar con el dedo para cambiar de película */
        let inicioX = null
        hero.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX }, { passive: true })
        hero.addEventListener('touchend', (e) => {
            if (inicioX === null) return
            const dx = e.changedTouches[0].clientX - inicioX
            inicioX = null
            if (Math.abs(dx) > 50) { ir(actual + (dx < 0 ? 1 : -1)); arrancar() }
        })
        hero.addEventListener('click', (e) => {
            const boton = e.target.closest('[data-trailer]')
            if (boton) abrirTrailer(boton.dataset.trailer, boton.dataset.titulo)
        })
        if (slides.length > 1) arrancar()
    }


    /* PLATAFORMAS */

    /* Tarjeta por plataforma con el número de películas que tiene */
    const pintarPlataformas = (conteo) => {
        plataformasContainer.innerHTML = Object.entries(PLATAFORMAS).map(([clave, p]) => `
            <a class="PlatformCard" href="catalogo.html?plataforma=${clave}" style="--brand:${p.color}">
                <img src="${p.logo}" alt="">
                <div><strong>${p.nombre}</strong><span>${conteo[clave] || 0} películas</span></div>
            </a>`).join('')
    }


    /* FILAS POR GÉNERO */

    /* Creamos las filas con tarjetas de carga y cada una pide sus películas */
    const crearFilas = () => {
        filasContainer.innerHTML = FILAS.map((f, i) => `
            <section class="Section Container Row" aria-labelledby="fila-${i}" data-fila="${i}">
                <div class="Section-head">
                    <div>
                        <h2 class="Section-title" id="fila-${i}">${esc(f.titulo)}</h2>
                        ${f.sub ? `<p class="Section-subtitle">${esc(f.sub)}</p>` : ''}
                    </div>
                    <div class="Section-controls">
                        <a class="Section-link" href="${encodeURI(f.link)}">Ver todo <span aria-hidden="true">→</span></a>
                        <button class="IconButton Row-button" data-dir="prev" aria-label="Anteriores">${ICON.left}</button>
                        <button class="IconButton Row-button" data-dir="next" aria-label="Siguientes">${ICON.right}</button>
                    </div>
                </div>
                <div class="Row-track">${skeletonCards(8)}</div>
            </section>`).join('')

        FILAS.forEach((f, i) => {
            const seccion = document.querySelector(`[data-fila="${i}"]`)
            api.peliculas.listar(f.query)
                .then((pelis) => {
                    if (!pelis.length) return seccion.remove()
                    $('.Row-track', seccion).innerHTML = pelis.map(cardPelicula).join('')
                    activarFila(seccion)
                })
                .catch((error) => {
                    $('.Row-track', seccion).outerHTML = estadoError(error)
                })
        })
    }


    /* NOTICIAS */

    /* Las 3 últimas noticias enlazan a la página de noticias, que abre cada una por su id */
    const pintarNoticias = (noticias) => {
        noticiasContainer.innerHTML = noticias.map((n) => `
            <a class="NewsCard" href="noticias.html?id=${n._id}">
                <div class="NewsCard-media"><img src="${esc(n.imagen)}" alt="" loading="lazy"></div>
                <div class="NewsCard-body">
                    <div class="NewsCard-meta"><span class="Tag Tag--accent">${esc(n.categoria)}</span><time datetime="${n.fecha}">${fechaLarga(n.fecha)}</time></div>
                    <h3 class="NewsCard-title">${esc(n.titulo)}</h3>
                    <p class="NewsCard-text">${esc(n.entradilla)}</p>
                    <span class="NewsCard-more">Leer noticia →</span>
                </div>
            </a>`).join('')
    }


    /* ARRANQUE */

    /* El carrusel va primero y solo: es lo que se ve al entrar. El resto de llamadas esperan a que cargue su primera imagen */
    const cargarSecciones = () => {
        crearFilas()

        api.peliculas.listar()
            .then((todas) => {
                const conteo = {}
                todas.forEach((p) => p.plataformas.forEach((pl) => { conteo[pl.clave] = (conteo[pl.clave] || 0) + 1 }))
                pintarPlataformas(conteo)
            })
            .catch(() => pintarPlataformas({}))

        api.noticias.listar({ limite: 3 })
            .then(pintarNoticias)
            .catch((error) => { noticiasContainer.innerHTML = estadoError(error) })
    }

    /* Solo películas que ya se pueden ver en streaming: los estrenos de cine no salen en la portada */
    api.peliculas.listar({ orden: 'recientes', limite: 12, enStreaming: true })
        .then((recientes) => {
            /* Las mismas que "Añadidas recientemente", solo las que tienen imagen apaisada */
            pintarHero(recientes.filter((p) => p.backdrop).slice(0, HERO_PELIS))
            return esperarImagen($('.Hero-background', hero))
        })
        .catch((error) => {
            hero.innerHTML = `<div class="Container" style="padding-top:calc(var(--header-h) + 80px)">${estadoError(error)}</div>`
        })
        .finally(() => setTimeout(cargarSecciones, PAUSA_MS))

})()
