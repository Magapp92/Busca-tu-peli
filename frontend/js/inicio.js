import { api } from './api.js'
import {
    $, $$, esc, ICON, PLATAFORMAS, cardPelicula, skeletonCards, activarFila,
    abrirTrailer, urlPelicula, duracion, fechaLarga, estadoError
} from './ui.js'

const HERO_MS = 7000
const FILAS = [
    { titulo: 'Añadidas recientemente', sub: 'Lo último que ha llegado al catálogo', query: { orden: 'recientes', limite: 12 }, link: 'catalogo.html?orden=recientes' },
    { titulo: 'Acción', query: { genero: 'Acción' }, link: 'catalogo.html?genero=Acción' },
    { titulo: 'Comedia', query: { genero: 'Comedia' }, link: 'catalogo.html?genero=Comedia' },
    { titulo: 'Drama', query: { genero: 'Drama' }, link: 'catalogo.html?genero=Drama' },
    { titulo: 'Romance', query: { genero: 'Romance' }, link: 'catalogo.html?genero=Romance' },
    { titulo: 'Terror', query: { genero: 'Terror' }, link: 'catalogo.html?genero=Terror' }
]

/* ---------- Hero con las películas destacadas ---------- */
const pintarHero = (pelis) => {
    const hero = $('[data-hero]')
    hero.style.setProperty('--hero-ms', `${HERO_MS}ms`)
    hero.innerHTML = pelis.map((p, i) => `
        <article class="hero__slide${i === 0 ? ' is-active' : ''}" aria-roledescription="diapositiva" aria-label="${i + 1} de ${pelis.length}" ${i ? 'aria-hidden="true"' : ''}>
            <img class="hero__bg" src="${esc(p.backdrop || p.poster)}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>
            <div class="hero__content container">
                <div class="hero__inner">
                    <div class="hero__eyebrow">
                        ${(p.plataformas || []).map((pl) => PLATAFORMAS[pl.clave] ? `<img class="hero__platform" src="${PLATAFORMAS[pl.clave].logo}" alt="${PLATAFORMAS[pl.clave].nombre}">` : '').join('')}
                        <span class="tag tag--accent">Destacada</span>
                    </div>
                    <h2 class="hero__title">${esc(p.titulo)}</h2>
                    <p class="hero__meta"><span>${esc(p.anio)}</span><span>${duracion(p.duracionMin)}</span><span>${esc(p.generos.slice(0, 3).join(', '))}</span></p>
                    <p class="hero__text">${esc(p.sinopsis)}</p>
                    <div class="hero__actions">
                        <button class="btn btn--primary" data-trailer="${esc(p.trailer)}" data-titulo="${esc(p.titulo)}">${ICON.play} Ver tráiler</button>
                        <a class="btn btn--ghost" href="${urlPelicula(p)}">${ICON.info} Más información</a>
                    </div>
                </div>
            </div>
        </article>`).join('') + `
        <div class="hero__dots" role="tablist" aria-label="Elegir destacada">
            ${pelis.map((p, i) => `<button class="hero__dot${i === 0 ? ' is-active' : ''}" role="tab" aria-label="${esc(p.titulo)}" aria-selected="${i === 0}"></button>`).join('')}
        </div>`

    const slides = $$('.hero__slide', hero)
    const dots = $$('.hero__dot', hero)
    let actual = 0
    let timer

    const ir = (n) => {
        slides[actual].classList.remove('is-active')
        slides[actual].setAttribute('aria-hidden', 'true')
        dots[actual].classList.remove('is-active')
        dots[actual].setAttribute('aria-selected', 'false')
        actual = (n + slides.length) % slides.length
        slides[actual].classList.add('is-active')
        slides[actual].removeAttribute('aria-hidden')
        /* Reiniciamos la animación de la barra de progreso */
        void dots[actual].offsetWidth
        dots[actual].classList.add('is-active')
        dots[actual].setAttribute('aria-selected', 'true')
    }
    const arrancar = () => { clearInterval(timer); timer = setInterval(() => ir(actual + 1), HERO_MS) }

    dots.forEach((d, i) => d.addEventListener('click', () => { ir(i); arrancar() }))
    hero.addEventListener('mouseenter', () => { clearInterval(timer); hero.classList.add('is-paused') })
    hero.addEventListener('mouseleave', () => { hero.classList.remove('is-paused'); arrancar() })
    hero.addEventListener('click', (e) => {
        const b = e.target.closest('[data-trailer]')
        if (b) abrirTrailer(b.dataset.trailer, b.dataset.titulo)
    })
    if (slides.length > 1) arrancar()
}

/* ---------- Plataformas ---------- */
const pintarPlataformas = (conteo) => {
    $('[data-plataformas]').innerHTML = Object.entries(PLATAFORMAS).map(([clave, p]) => `
        <a class="platform-card" href="catalogo.html?plataforma=${clave}" style="--brand:${p.color}">
            <img src="${p.logo}" alt="">
            <div><strong>${p.nombre}</strong><span>${conteo[clave] || 0} películas</span></div>
        </a>`).join('')
}

/* ---------- Filas por género ---------- */
const crearFilas = () => {
    $('[data-filas]').innerHTML = FILAS.map((f, i) => `
        <section class="section container row" aria-labelledby="fila-${i}" data-fila="${i}">
            <div class="section__head">
                <div>
                    <h2 class="section__title" id="fila-${i}">${esc(f.titulo)}</h2>
                    ${f.sub ? `<p class="section__sub">${esc(f.sub)}</p>` : ''}
                </div>
                <div class="section__controls">
                    <a class="section__link" href="${encodeURI(f.link)}">Ver todo <span aria-hidden="true">→</span></a>
                    <button class="icon-btn row__btn" data-dir="prev" aria-label="Anteriores">${ICON.left}</button>
                    <button class="icon-btn row__btn" data-dir="next" aria-label="Siguientes">${ICON.right}</button>
                </div>
            </div>
            <div class="row__track">${skeletonCards(8)}</div>
        </section>`).join('')

    /* Cada fila hace su propia llamada filtrada a la API */
    FILAS.forEach(async (f, i) => {
        const seccion = $(`[data-fila="${i}"]`)
        try {
            const pelis = await api.peliculas.listar(f.query)
            if (!pelis.length) return seccion.remove()
            $('.row__track', seccion).innerHTML = pelis.map(cardPelicula).join('')
            activarFila(seccion)
        } catch (error) {
            $('.row__track', seccion).outerHTML = estadoError(error)
        }
    })
}

/* ---------- Noticias ---------- */
const pintarNoticias = (noticias) => {
    $('[data-noticias]').innerHTML = noticias.map((n) => `
        <a class="news-card" href="noticias.html?id=${n._id}">
            <div class="news-card__media"><img src="${esc(n.imagen)}" alt="" loading="lazy"></div>
            <div class="news-card__body">
                <div class="news-card__meta"><span class="tag tag--accent">${esc(n.categoria)}</span><time datetime="${n.fecha}">${fechaLarga(n.fecha)}</time></div>
                <h3 class="news-card__title">${esc(n.titulo)}</h3>
                <p class="news-card__text">${esc(n.entradilla)}</p>
                <span class="news-card__more">Leer noticia →</span>
            </div>
        </a>`).join('')
}

const iniciar = async () => {
    crearFilas()

    try {
        const [destacadas, todas, noticias] = await Promise.all([
            api.peliculas.listar({ destacada: true, orden: 'recientes' }),
            api.peliculas.listar(),
            api.noticias.listar({ limite: 3 })
        ])

        pintarHero(destacadas.length ? destacadas : todas.slice(0, 5))

        const conteo = {}
        todas.forEach((p) => p.plataformas.forEach((pl) => { conteo[pl.clave] = (conteo[pl.clave] || 0) + 1 }))
        pintarPlataformas(conteo)

        pintarNoticias(noticias)
    } catch (error) {
        $('[data-hero]').innerHTML = `<div class="container" style="padding-top:calc(var(--header-h) + 80px)">${estadoError(error)}</div>`
        pintarPlataformas({})
    }
}

iniciar()
