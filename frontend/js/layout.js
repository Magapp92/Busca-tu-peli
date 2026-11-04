/* Header y footer comunes a todas las páginas + buscador con sugerencias desde la API */
import { api } from './api.js'
import { $, esc, ICON, PLATAFORMAS, urlPelicula, debounce, toast } from './ui.js'

const LINKS = [
    { href: 'index.html', texto: 'Inicio' },
    { href: 'catalogo.html', texto: 'Catálogo' },
    { href: 'noticias.html', texto: 'Noticias' },
    { href: 'recomendaciones.html', texto: 'Recomendar' }
]

const actual = location.pathname.split('/').pop() || 'index.html'

const header = () => `
<header class="header" data-header>
    <div class="container header__inner">
        <a class="header__logo" href="index.html" aria-label="Busca tu peli, inicio">
            <img src="assets/logo/logobuscatupeli.svg" alt="Busca tu peli" width="152" height="38">
        </a>
        <nav class="nav" id="nav" aria-label="Principal">
            ${LINKS.map((l) => `<a class="nav__link${actual === l.href ? ' is-current' : ''}" href="${l.href}"${actual === l.href ? ' aria-current="page"' : ''}>${l.texto}</a>`).join('')}
        </nav>
        <div class="search" role="search">
            <label class="search__field">
                ${ICON.search}
                <span class="sr-only">Buscar películas</span>
                <input class="search__input" type="search" placeholder="Título, actor o director…" autocomplete="off"
                    aria-controls="search-results" aria-expanded="false" aria-autocomplete="list">
                <kbd class="search__kbd">/</kbd>
            </label>
            <div class="search__results" id="search-results" role="listbox"></div>
        </div>
        <button class="icon-btn header__menu-btn" aria-label="Abrir menú" aria-controls="nav" aria-expanded="false">${ICON.menu}</button>
    </div>
</header>`

const footer = () => `
<footer class="footer">
    <div class="container footer__inner">
        <div class="footer__brand">
            <img src="assets/logo/logobuscatupeli.svg" alt="Busca tu peli" width="136" height="34">
            <p>Encuentra en qué plataforma ver cada película, sin saltar de app en app.</p>
        </div>
        <div class="footer__col">
            <h3>Explorar</h3>
            <ul>${LINKS.map((l) => `<li><a href="${l.href}">${l.texto}</a></li>`).join('')}</ul>
        </div>
        <div class="footer__col">
            <h3>Plataformas</h3>
            <ul>${Object.entries(PLATAFORMAS).map(([k, p]) => `<li><a href="catalogo.html?plataforma=${k}">${p.nombre}</a></li>`).join('')}</ul>
        </div>
        <div class="footer__news">
            <h3>Novedades por email</h3>
            <p>Te avisamos cuando llegan pelis nuevas al catálogo.</p>
            <form class="footer__form" novalidate>
                <label class="sr-only" for="newsletter">Email</label>
                <input class="input" id="newsletter" type="email" placeholder="tu@email.com" required>
                <button class="btn btn--primary" type="submit">Suscribirme</button>
            </form>
        </div>
    </div>
    <div class="container footer__bottom">
        <span>© ${new Date().getFullYear()} Busca tu peli · info@buscatupeli.com</span>
        <a href="admin.html">Panel de administración</a>
    </div>
    <div class="container footer__bottom">
        <span>Datos e imágenes de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a> · Disponibilidad por <a href="https://www.justwatch.com/es" target="_blank" rel="noopener">JustWatch</a>. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.</span>
    </div>
</footer>`

const iniciarHeader = () => {
    const h = $('[data-header]')
    const solido = () => h.classList.toggle('is-solid', window.scrollY > 24 || document.body.dataset.solidHeader === 'true')
    solido()
    window.addEventListener('scroll', solido, { passive: true })

    const btn = $('.header__menu-btn', h)
    const nav = $('#nav')
    btn.addEventListener('click', () => {
        const abierto = nav.classList.toggle('is-open')
        btn.setAttribute('aria-expanded', abierto)
        btn.innerHTML = abierto ? ICON.close : ICON.menu
    })
}

/* Buscador: sugerencias en vivo, navegación con flechas y Enter para ir al catálogo */
const iniciarBuscador = () => {
    const input = $('.search__input')
    const lista = $('#search-results')
    let items = []
    let activo = -1

    const cerrar = () => { lista.classList.remove('is-open'); input.setAttribute('aria-expanded', 'false'); activo = -1 }
    const marcar = () => [...lista.querySelectorAll('.search__item')].forEach((el, i) => el.classList.toggle('is-active', i === activo))

    const pintar = (q) => {
        lista.innerHTML = items.length
            ? items.map((p, i) => `
                <a class="search__item" role="option" id="sug-${i}" href="${urlPelicula(p)}">
                    <img src="${esc(p.poster)}" alt="">
                    <div><strong>${esc(p.titulo)}</strong><span>${esc(p.anio)} · ${esc((p.generos || []).slice(0, 2).join(', '))}</span></div>
                </a>`).join('') + `<a class="search__all" href="catalogo.html?q=${encodeURIComponent(q)}">Ver todos los resultados</a>`
            : `<p class="search__empty">Sin resultados para “${esc(q)}”</p>`
        lista.classList.add('is-open')
        input.setAttribute('aria-expanded', 'true')
    }

    const buscar = debounce(async (q) => {
        try {
            items = await api.peliculas.listar({ q, limite: 6 })
            if (input.value.trim() === q) pintar(q)
        } catch (error) {
            toast(error.message, 'error')
        }
    }, 220)

    input.addEventListener('input', () => {
        const q = input.value.trim()
        q.length >= 2 ? buscar(q) : cerrar()
    })

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); activo = (activo + 1) % items.length; marcar() }
        if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); activo = (activo - 1 + items.length) % items.length; marcar() }
        if (e.key === 'Escape') { cerrar(); input.blur() }
        if (e.key === 'Enter') {
            e.preventDefault()
            const q = input.value.trim()
            if (activo >= 0 && items[activo]) location.href = urlPelicula(items[activo])
            else if (q) location.href = `catalogo.html?q=${encodeURIComponent(q)}`
        }
    })

    document.addEventListener('click', (e) => { if (!e.target.closest('.search')) cerrar() })
    /* Atajo "/" para enfocar el buscador */
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            e.preventDefault()
            input.focus()
        }
    })
}

const iniciarNewsletter = () => {
    const form = $('.footer__form')
    form.addEventListener('submit', (e) => {
        e.preventDefault()
        const email = form.querySelector('input')
        if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.value.trim())) return toast('Introduce un email válido', 'error')
        email.value = ''
        toast('¡Listo! Te avisaremos de las novedades')
    })
}

document.body.insertAdjacentHTML('afterbegin', header())
document.body.insertAdjacentHTML('beforeend', footer())
iniciarHeader()
iniciarBuscador()
iniciarNewsletter()
