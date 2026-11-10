/* Piezas de interfaz reutilizables: tarjetas, iconos, estados, modal y toasts.
   Se carga antes que el script de cada página y sus constantes quedan disponibles para todas */

/* Plataformas con su nombre, logo y color de marca */
const PLATAFORMAS = {
    netflix: { nombre: 'Netflix', logo: 'assets/svg/netflix.svg', color: '#e50914' },
    prime: { nombre: 'Prime Video', logo: 'assets/svg/amazonPrime.svg', color: '#29b6f6' },
    disney: { nombre: 'Disney+', logo: 'assets/svg/disney.svg', color: '#194bf8' },
    max: { nombre: 'Max', logo: 'assets/svg/hboMax.svg', color: '#7b2ff7' },
    appletv: { nombre: 'Apple TV+', logo: 'assets/svg/appleTv.svg', color: '#a3aab3' }
}

/* Escapa texto antes de meterlo en plantillas HTML */
const esc = (valor = '') => String(valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/* Atajos para seleccionar uno o varios elementos */
const $ = (selector, contexto = document) => contexto.querySelector(selector)
const $$ = (selector, contexto = document) => [...contexto.querySelectorAll(selector)]

const urlPelicula = (p) => `pelicula.html?id=${p._id}`

/* Convierte minutos en "2 h 13 min" */
const duracion = (min) => {
    if (!min) return ''
    const h = Math.floor(min / 60)
    const m = min % 60
    return h ? `${h} h ${m ? `${m} min` : ''}`.trim() : `${m} min`
}

const fechaLarga = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

/* Iconos SVG que se usan en las plantillas */
const ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.8-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'
}

/* Pósters de TMDB: la tarjeta mide como mucho unos 250px, así que el navegador elige entre w185, w342 y w500 */
const fuentePoster = (url) => {
    if (!/image\.tmdb\.org\/t\/p\/w\d+\//.test(url)) return `src="${esc(url)}"`
    const tam = (t) => esc(url.replace(/\/t\/p\/w\d+\//, `/t/p/${t}/`))
    return `src="${tam('w342')}" srcset="${tam('w185')} 185w, ${tam('w342')} 342w, ${tam('w500')} 500w" sizes="(max-width: 600px) 45vw, 250px"`
}

/* Tarjeta de póster: al clicar abre la ficha, que pide la película por id a la API */
const cardPelicula = (p) => `
    <a class="MovieCard" href="${urlPelicula(p)}" aria-label="${esc(p.titulo)} (${esc(p.anio)})">
        <img class="MovieCard-image" ${fuentePoster(p.poster)} alt="" loading="lazy">
        <div class="MovieCard-platforms">
            ${(p.plataformas || []).map((pl) => PLATAFORMAS[pl.clave]
                ? `<img src="${PLATAFORMAS[pl.clave].logo}" alt="${PLATAFORMAS[pl.clave].nombre}" title="${PLATAFORMAS[pl.clave].nombre}">`
                : '').join('')}
        </div>
        <div class="MovieCard-overlay">
            <h3 class="MovieCard-title">${esc(p.titulo)}</h3>
            <p class="MovieCard-meta">${esc(p.anio)} · ${esc((p.generos || []).slice(0, 2).join(', '))}</p>
        </div>
    </a>`

/* Tarjetas grises mientras llegan los datos */
const skeletonCards = (n = 8) => Array.from({ length: n }, () => '<div class="Skeleton Skeleton--card"></div>').join('')

/* Estados de vacío y de error con su icono */
const estadoVacio = (titulo, texto = '') => `
    <div class="State">${ICON.film}<strong>${esc(titulo)}</strong>${texto ? `<p>${esc(texto)}</p>` : ''}</div>`

const estadoError = (error) => `
    <div class="State State--error">${ICON.alert}<strong>Algo ha fallado</strong><p>${esc(error.message)}</p>
    <button class="Button Button--outline Button--small" data-element="reintentar">Reintentar</button></div>`

/* El botón Reintentar recarga la página (sin onclick en el HTML: la política de seguridad no permite scripts en línea) */
document.addEventListener('click', (e) => {
    if (e.target.closest('[data-element="reintentar"]')) location.reload()
})

/* ENLACES SEGUROS */

/* Solo incrustamos vídeos de YouTube: cualquier otra dirección (p. ej. javascript:) se descarta */
const URL_YOUTUBE = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]+(\?[\w=&%.-]*)?$/

/* Dirección del tráiler con autoplay, respetando si ya trae parámetros (?si=…); vacía si no es de YouTube.
   Se incrusta desde youtube-nocookie.com, el modo de privacidad de YouTube: no guarda cookies hasta reproducir */
const urlTrailer = (url = '') => (URL_YOUTUBE.test(url)
    ? `${url.replace('://www.youtube.com/', '://www.youtube-nocookie.com/')}${url.includes('?') ? '&' : '?'}autoplay=1&rel=0`
    : '')

/* Enlaces externos solo por https; si no, el enlace no lleva a ningún sitio */
const urlEnlace = (url = '') => (/^https:\/\//.test(url) ? url : '#')

/* Fila horizontal con flechas que se desactivan en los extremos */
const activarFila = (seccion) => {
    const track = $('.Row-track', seccion)
    const prev = $('[data-dir="prev"]', seccion)
    const next = $('[data-dir="next"]', seccion)
    if (!track || !prev || !next) return

    const actualizar = () => {
        prev.disabled = track.scrollLeft <= 4
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4
    }
    const mover = (dir) => track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: 'smooth' })

    prev.addEventListener('click', () => mover(-1))
    next.addEventListener('click', () => mover(1))
    track.addEventListener('scroll', actualizar, { passive: true })
    window.addEventListener('resize', actualizar)
    actualizar()
}

/* MODAL GENÉRICO */

/* El modal se crea una sola vez y se reutiliza; guardamos el foco previo para devolverlo al cerrar */
let modalCreado = null
let focoAntesDelModal = null

const asegurarModal = () => {
    if (modalCreado) return modalCreado
    modalCreado = document.createElement('div')
    modalCreado.className = 'Modal'
    modalCreado.setAttribute('role', 'dialog')
    modalCreado.setAttribute('aria-modal', 'true')
    modalCreado.innerHTML = `<div class="Modal-box"><button class="IconButton Modal-close" aria-label="Cerrar">${ICON.close}</button><div class="Modal-content"></div></div>`
    document.body.append(modalCreado)
    modalCreado.addEventListener('click', (e) => { if (e.target === modalCreado || e.target.closest('.Modal-close')) cerrarModal() })
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalCreado.classList.contains('isOpen')) cerrarModal() })
    return modalCreado
}

const abrirModal = (html, { video = false, onClose } = {}) => {
    const m = asegurarModal()
    focoAntesDelModal = document.activeElement
    $('.Modal-box', m).classList.toggle('Modal-box--video', video)
    $('.Modal-content', m).innerHTML = html
    m._onClose = onClose
    m.classList.add('isOpen')
    document.body.style.overflow = 'hidden'
    $('.Modal-close', m).focus()
}

const cerrarModal = () => {
    if (!modalCreado) return
    modalCreado.classList.remove('isOpen')
    document.body.style.overflow = ''
    /* Vaciamos tras la animación para cortar el vídeo */
    setTimeout(() => { $('.Modal-content', modalCreado).innerHTML = '' }, 250)
    modalCreado._onClose?.()
    focoAntesDelModal?.focus?.()
}

/* Abre el tráiler de YouTube en el modal con reproducción automática */
const abrirTrailer = (url, titulo = 'Tráiler') => {
    const src = urlTrailer(url)
    if (!src) return toast('Esta película no tiene tráiler disponible', 'error')
    abrirModal(`<div class="Video"><iframe src="${esc(src)}" title="${esc(titulo)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`, { video: true })
}

/* TOASTS */

/* Aviso breve abajo de la pantalla que desaparece a los 4 segundos */
const toast = (mensaje, tipo = 'ok') => {
    let contenedor = $('.Toasts')
    if (!contenedor) {
        contenedor = document.createElement('div')
        contenedor.className = 'Toasts'
        contenedor.setAttribute('aria-live', 'polite')
        document.body.append(contenedor)
    }
    const aviso = document.createElement('div')
    aviso.className = `Toast${tipo === 'error' ? ' Toast--error' : ''}`
    aviso.textContent = mensaje
    contenedor.append(aviso)
    setTimeout(() => aviso.remove(), 4000)
}

/* Mini debounce para el buscador */
const debounce = (fn, ms = 250) => {
    let id
    return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms) }
}
