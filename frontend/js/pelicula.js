/* Ficha: lee ?id= de la URL, pide la película a la API y vuelca toda su información */
import { api } from './api.js'
import { $, esc, ICON, PLATAFORMAS, cardPelicula, activarFila, abrirTrailer, duracion, estadoError, estadoVacio } from './ui.js'

const main = $('[data-pelicula]')
const id = new URLSearchParams(location.search).get('id')

const iniciales = (nombre) => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
const lista = (arr) => (arr && arr.length ? esc(arr.join(', ')) : '—')
const idYoutube = (url = '') => url.match(/embed\/([\w-]{6,})/)?.[1]

const pintar = (p) => {
    document.title = `${p.titulo} (${p.anio}) · Busca tu peli`
    $('meta[name="description"]').setAttribute('content', p.sinopsis.slice(0, 155))

    const yt = idYoutube(p.trailer)
    const portada = yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : (p.backdrop || p.poster)

    main.innerHTML = `
    <article class="movie">
        <div class="movie__backdrop${p.backdrop ? '' : ' is-blur'}"><img src="${esc(p.backdrop || p.poster)}" alt=""></div>
        <div class="container">
            <div class="movie__layout">
                <div class="movie__poster"><img src="${esc(p.poster)}" alt="Póster de ${esc(p.titulo)}"></div>
                <div>
                    <nav class="movie__crumbs" aria-label="Migas">
                        <a href="index.html">Inicio</a><span aria-hidden="true">/</span>
                        <a href="catalogo.html?genero=${encodeURIComponent(p.generos[0] || '')}">${esc(p.generos[0] || 'Catálogo')}</a>
                    </nav>
                    <h1 class="movie__title">${esc(p.titulo)}</h1>
                    ${p.tituloOriginal && p.tituloOriginal !== p.titulo ? `<p class="movie__original">Título original: ${esc(p.tituloOriginal)}</p>` : ''}

                    <div class="movie__meta">
                        <span class="tag">${esc(p.anio)}</span>
                        ${p.duracionMin ? `<span class="tag">${duracion(p.duracionMin)}</span>` : ''}
                        ${p.pais ? `<span class="tag">${esc(p.pais)}</span>` : ''}
                        ${p.generos.map((g) => `<a class="tag tag--accent" href="catalogo.html?genero=${encodeURIComponent(g)}">${esc(g)}</a>`).join('')}
                    </div>

                    <p class="movie__synopsis">${esc(p.sinopsis)}</p>

                    <div class="movie__actions">
                        ${p.trailer ? `<button class="btn btn--primary" data-trailer>${ICON.play} Ver tráiler</button>` : ''}
                        <a class="btn btn--ghost" href="catalogo.html?genero=${encodeURIComponent(p.generos[0] || '')}">Más de ${esc(p.generos[0] || 'este género')}</a>
                    </div>

                    <section class="where" aria-labelledby="t-where">
                        <h2 class="where__title" id="t-where">Dónde ver</h2>
                        <div class="where__list">
                            ${p.plataformas.length ? p.plataformas.map((pl) => {
                                const info = PLATAFORMAS[pl.clave] || { nombre: pl.clave, logo: '' }
                                return `<a class="provider" href="${esc(pl.url)}" target="_blank" rel="noopener noreferrer">
                                    <img src="${info.logo}" alt=""><div><strong>${esc(info.nombre)}</strong><span>Suscripción · Ver ahora ↗</span></div>
                                </a>`
                            }).join('') : '<p class="section__sub">Ahora mismo no está disponible en ninguna plataforma.</p>'}
                        </div>
                    </section>
                </div>
            </div>

            <div class="details">
                <section aria-labelledby="t-reparto">
                    <h2 class="block-title" id="t-reparto">Reparto principal</h2>
                    <ul class="cast">
                        ${p.reparto.map((a) => `<li class="cast__item"><span class="cast__avatar" aria-hidden="true">${esc(iniciales(a))}</span>${esc(a)}</li>`).join('') || '<li class="section__sub">Sin datos de reparto</li>'}
                    </ul>
                </section>
                <section aria-labelledby="t-ficha">
                    <h2 class="block-title" id="t-ficha">Ficha técnica</h2>
                    <dl class="facts">
                        <div class="fact"><dt>Dirección</dt><dd>${lista(p.direccion)}</dd></div>
                        <div class="fact"><dt>Año</dt><dd>${esc(p.anio)}</dd></div>
                        <div class="fact"><dt>Guion</dt><dd>${lista(p.guion)}</dd></div>
                        <div class="fact"><dt>Duración</dt><dd>${duracion(p.duracionMin) || '—'}</dd></div>
                        <div class="fact fact--wide"><dt>Productoras</dt><dd>${lista(p.companias)}</dd></div>
                    </dl>
                </section>
            </div>

            ${p.trailer ? `
            <section class="trailer" aria-labelledby="t-trailer">
                <h2 class="block-title" id="t-trailer">Tráiler</h2>
                <div class="trailer__frame">
                    <button class="trailer__facade" data-cargar-trailer aria-label="Reproducir tráiler de ${esc(p.titulo)}">
                        <img src="${esc(portada)}" alt="" loading="lazy">
                        <span class="trailer__play">${ICON.play}</span>
                    </button>
                </div>
            </section>` : ''}
        </div>
    </article>

    <section class="section container row" aria-labelledby="t-rel" data-relacionadas>
        <div class="section__head">
            <h2 class="section__title" id="t-rel">También te puede gustar</h2>
            <div class="section__controls">
                <button class="icon-btn row__btn" data-dir="prev" aria-label="Anteriores">${ICON.left}</button>
                <button class="icon-btn row__btn" data-dir="next" aria-label="Siguientes">${ICON.right}</button>
            </div>
        </div>
        <div class="row__track"></div>
    </section>`

    $('[data-trailer]')?.addEventListener('click', () => abrirTrailer(p.trailer, p.titulo))

    /* El iframe de YouTube solo se carga al pulsar: la ficha abre más rápido */
    $('[data-cargar-trailer]')?.addEventListener('click', (e) => {
        e.currentTarget.parentElement.innerHTML = `<iframe src="${esc(p.trailer)}?autoplay=1&rel=0" title="Tráiler de ${esc(p.titulo)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
    })
}

const pintarRelacionadas = async () => {
    const seccion = $('[data-relacionadas]')
    try {
        const rel = await api.peliculas.relacionadas(id)
        if (!rel.length) return seccion.remove()
        $('.row__track', seccion).innerHTML = rel.map(cardPelicula).join('')
        activarFila(seccion)
    } catch {
        seccion.remove()
    }
}

const iniciar = async () => {
    const vacio = (t, s) => { main.innerHTML = `<div class="container" style="padding-top:calc(var(--header-h) + 64px)">${estadoVacio(t, s)}<p style="text-align:center;margin-top:1rem"><a class="btn btn--primary" href="catalogo.html">Ir al catálogo</a></p></div>` }

    if (!id) return vacio('No has elegido ninguna película', 'Vuelve al catálogo y pulsa sobre un póster.')

    try {
        const peli = await api.peliculas.obtener(id)
        pintar(peli)
        pintarRelacionadas()
    } catch (error) {
        if (error.status === 404 || error.status === 400) return vacio('Esta película no existe', 'Puede que se haya retirado del catálogo.')
        main.innerHTML = `<div class="container" style="padding-top:calc(var(--header-h) + 64px)">${estadoError(error)}</div>`
    }
}

iniciar()
