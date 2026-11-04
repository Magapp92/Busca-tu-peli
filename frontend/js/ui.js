/* Piezas de interfaz reutilizables: tarjetas, iconos, estados, modal y toasts */

export const PLATAFORMAS = {
    netflix: { nombre: 'Netflix', logo: 'assets/svg/netflix.svg', color: '#e50914' },
    prime: { nombre: 'Prime Video', logo: 'assets/svg/amazonPrime.svg', color: '#29b6f6' },
    disney: { nombre: 'Disney+', logo: 'assets/svg/disney.svg', color: '#194bf8' },
    max: { nombre: 'Max', logo: 'assets/svg/hboMax.svg', color: '#7b2ff7' },
    appletv: { nombre: 'Apple TV+', logo: 'assets/svg/appleTv.svg', color: '#a3aab3' }
}

/* Escapa texto antes de meterlo en plantillas HTML */
export const esc = (valor = '') => String(valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const $ = (sel, ctx = document) => ctx.querySelector(sel)
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)]

export const urlPelicula = (p) => `pelicula.html?id=${p._id}`

export const duracion = (min) => {
    if (!min) return ''
    const h = Math.floor(min / 60)
    const m = min % 60
    return h ? `${h} h ${m ? `${m} min` : ''}`.trim() : `${m} min`
}

export const fechaLarga = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

export const ICON = {
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

/* Tarjeta de póster: al clicar abre la ficha, que pide la película por id a la API */
export const cardPelicula = (p) => `
    <a class="card" href="${urlPelicula(p)}" aria-label="${esc(p.titulo)} (${esc(p.anio)})">
        <img class="card__img" src="${esc(p.poster)}" alt="" loading="lazy">
        <div class="card__platforms">
            ${(p.plataformas || []).map((pl) => PLATAFORMAS[pl.clave]
                ? `<img src="${PLATAFORMAS[pl.clave].logo}" alt="${PLATAFORMAS[pl.clave].nombre}" title="${PLATAFORMAS[pl.clave].nombre}">`
                : '').join('')}
        </div>
        <div class="card__overlay">
            <h3 class="card__title">${esc(p.titulo)}</h3>
            <p class="card__meta">${esc(p.anio)} · ${esc((p.generos || []).slice(0, 2).join(', '))}</p>
        </div>
    </a>`

export const skeletonCards = (n = 8) => Array.from({ length: n }, () => '<div class="skeleton skeleton--card"></div>').join('')

export const estadoVacio = (titulo, texto = '') => `
    <div class="state">${ICON.film}<strong>${esc(titulo)}</strong>${texto ? `<p>${esc(texto)}</p>` : ''}</div>`

export const estadoError = (error) => `
    <div class="state state--error">${ICON.alert}<strong>Algo ha fallado</strong><p>${esc(error.message)}</p>
    <button class="btn btn--outline btn--sm" onclick="location.reload()">Reintentar</button></div>`

/* Fila horizontal con flechas que se desactivan en los extremos */
export const activarFila = (seccion) => {
    const track = $('.row__track', seccion)
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

/* ---------- Modal genérico ---------- */
let modalEl = null
let focoPrevio = null

const asegurarModal = () => {
    if (modalEl) return modalEl
    modalEl = document.createElement('div')
    modalEl.className = 'modal'
    modalEl.setAttribute('role', 'dialog')
    modalEl.setAttribute('aria-modal', 'true')
    modalEl.innerHTML = `<div class="modal__box"><button class="icon-btn modal__close" aria-label="Cerrar">${ICON.close}</button><div class="modal__content"></div></div>`
    document.body.append(modalEl)
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl || e.target.closest('.modal__close')) cerrarModal() })
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalEl.classList.contains('is-open')) cerrarModal() })
    return modalEl
}

export const abrirModal = (html, { video = false, onClose } = {}) => {
    const m = asegurarModal()
    focoPrevio = document.activeElement
    $('.modal__box', m).classList.toggle('modal__box--video', video)
    $('.modal__content', m).innerHTML = html
    m._onClose = onClose
    m.classList.add('is-open')
    document.body.style.overflow = 'hidden'
    $('.modal__close', m).focus()
}

export const cerrarModal = () => {
    if (!modalEl) return
    modalEl.classList.remove('is-open')
    document.body.style.overflow = ''
    /* Vaciamos tras la animación para cortar el vídeo */
    setTimeout(() => { $('.modal__content', modalEl).innerHTML = '' }, 250)
    modalEl._onClose?.()
    focoPrevio?.focus?.()
}

export const abrirTrailer = (url, titulo = 'Tráiler') => {
    if (!url) return toast('Esta película no tiene tráiler disponible', 'error')
    const src = `${url}${url.includes('?') ? '&' : '?'}autoplay=1&rel=0`
    abrirModal(`<div class="video"><iframe src="${esc(src)}" title="${esc(titulo)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`, { video: true })
}

/* ---------- Toasts ---------- */
export const toast = (mensaje, tipo = 'ok') => {
    let cont = $('.toasts')
    if (!cont) {
        cont = document.createElement('div')
        cont.className = 'toasts'
        cont.setAttribute('aria-live', 'polite')
        document.body.append(cont)
    }
    const t = document.createElement('div')
    t.className = `toast${tipo === 'error' ? ' toast--error' : ''}`
    t.textContent = mensaje
    cont.append(t)
    setTimeout(() => t.remove(), 4000)
}

/* Mini debounce para el buscador */
export const debounce = (fn, ms = 250) => {
    let id
    return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms) }
}
