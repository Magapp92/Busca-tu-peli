/* Ficha: lee ?id= de la URL, pide la película a la API y vuelca toda su información */

// IIFE que agrupa la ficha para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const main = document.querySelector('[data-element="pelicula"]')
    const metaDescription = document.querySelector('meta[name="description"]')
    const id = new URLSearchParams(location.search).get('id')

    /* Pequeñas ayudas para el reparto, las listas y la portada del tráiler */
    const iniciales = (nombre) => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    const lista = (arr) => (arr && arr.length ? esc(arr.join(', ')) : '—')
    const idYoutube = (url = '') => url.match(/embed\/([\w-]{6,})/)?.[1]

    /* Volcamos toda la información de la película en el main */
    const pintar = (p) => {
        document.title = `${p.titulo} (${p.anio}) · Busca tu peli`
        metaDescription.setAttribute('content', p.sinopsis.slice(0, 155))

        const yt = idYoutube(p.trailer)
        const portada = yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : (p.backdrop || p.poster)

        main.innerHTML = `
        <article class="Movie">
            <div class="Movie-backdrop${p.backdrop ? '' : ' isBlurred'}"><img src="${esc(p.backdrop || p.poster)}" alt=""></div>
            <div class="Container">
                <div class="Movie-layout">
                    <div class="Movie-poster"><img src="${esc(p.poster)}" alt="Póster de ${esc(p.titulo)}"></div>
                    <div class="Movie-info">
                        <nav class="Movie-crumbs" aria-label="Migas">
                            <a href="index.html">Inicio</a><span aria-hidden="true">/</span>
                            <a href="catalogo.html?genero=${encodeURIComponent(p.generos[0] || '')}">${esc(p.generos[0] || 'Catálogo')}</a>
                        </nav>
                        <h1 class="Movie-title">${esc(p.titulo)}</h1>
                        ${p.tituloOriginal && p.tituloOriginal !== p.titulo ? `<p class="Movie-originalTitle">Título original: ${esc(p.tituloOriginal)}</p>` : ''}

                        <div class="Movie-meta">
                            <span class="Tag">${esc(p.anio)}</span>
                            ${p.duracionMin ? `<span class="Tag">${duracion(p.duracionMin)}</span>` : ''}
                            ${p.pais ? `<span class="Tag">${esc(p.pais)}</span>` : ''}
                            ${p.generos.map((g) => `<a class="Tag Tag--accent" href="catalogo.html?genero=${encodeURIComponent(g)}">${esc(g)}</a>`).join('')}
                        </div>

                        <p class="Movie-synopsis">${esc(p.sinopsis)}</p>

                        <div class="Movie-actions">
                            ${p.trailer ? `<button class="Button Button--primary" data-element="trailer">${ICON.play} Ver tráiler</button>` : ''}
                            <a class="Button Button--ghost" href="catalogo.html?genero=${encodeURIComponent(p.generos[0] || '')}">Más de ${esc(p.generos[0] || 'este género')}</a>
                        </div>
                    </div>

                    <section class="WhereToWatch" aria-labelledby="t-where">
                        <h2 class="WhereToWatch-title" id="t-where">Dónde ver</h2>
                        <div class="WhereToWatch-list">
                            ${p.plataformas.length ? p.plataformas.map((pl) => {
                                const info = PLATAFORMAS[pl.clave] || { nombre: pl.clave, logo: '' }
                                return `<a class="Provider" href="${esc(urlEnlace(pl.url))}" target="_blank" rel="noopener noreferrer">
                                    <img src="${info.logo}" alt=""><div><strong>${esc(info.nombre)}</strong><span>Suscripción · Ver ahora ↗</span></div>
                                </a>`
                            }).join('') : '<p class="Section-subtitle">Ahora mismo no está disponible en ninguna plataforma.</p>'}
                        </div>
                    </section>
                </div>

                <div class="Details">
                    <section class="Details-cast" aria-labelledby="t-reparto">
                        <h2 class="BlockTitle" id="t-reparto">Reparto principal</h2>
                        <ul class="Cast">
                            ${p.reparto.map((a) => `<li class="Cast-item"><span class="Cast-avatar" aria-hidden="true">${esc(iniciales(a))}</span>${esc(a)}</li>`).join('') || '<li class="Section-subtitle">Sin datos de reparto</li>'}
                        </ul>
                    </section>
                    <section class="Details-facts" aria-labelledby="t-ficha">
                        <h2 class="BlockTitle" id="t-ficha">Ficha técnica</h2>
                        <dl class="Facts">
                            <div class="Facts-item"><dt>Dirección</dt><dd>${lista(p.direccion)}</dd></div>
                            <div class="Facts-item"><dt>Año</dt><dd>${esc(p.anio)}</dd></div>
                            <div class="Facts-item"><dt>Guion</dt><dd>${lista(p.guion)}</dd></div>
                            <div class="Facts-item"><dt>Duración</dt><dd>${duracion(p.duracionMin) || '—'}</dd></div>
                            <div class="Facts-item Facts-item--wide"><dt>Productoras</dt><dd>${lista(p.companias)}</dd></div>
                        </dl>
                    </section>
                    ${p.trailer ? `
                    <section class="Trailer" aria-labelledby="t-trailer">
                        <h2 class="BlockTitle" id="t-trailer">Tráiler</h2>
                        <div class="Trailer-frame">
                            <button class="Trailer-facade" data-element="cargar-trailer" aria-label="Reproducir tráiler de ${esc(p.titulo)}">
                                <img src="${esc(portada)}" alt="" loading="lazy">
                                <span class="Trailer-play">${ICON.play}</span>
                            </button>
                        </div>
                    </section>` : ''}
                </div>
            </div>
        </article>

        <section class="Section Container Row" aria-labelledby="t-rel" data-element="relacionadas">
            <div class="Section-head">
                <h2 class="Section-title" id="t-rel">También te puede gustar</h2>
                <div class="Section-controls">
                    <button class="IconButton Row-button" data-dir="prev" aria-label="Anteriores">${ICON.left}</button>
                    <button class="IconButton Row-button" data-dir="next" aria-label="Siguientes">${ICON.right}</button>
                </div>
            </div>
            <div class="Row-track"></div>
        </section>`

        $('[data-element="trailer"]')?.addEventListener('click', () => abrirTrailer(p.trailer, p.titulo))

        /* El iframe de YouTube solo se carga al pulsar: la ficha abre más rápido */
        $('[data-element="cargar-trailer"]')?.addEventListener('click', (e) => {
            e.currentTarget.parentElement.innerHTML = `<iframe src="${esc(urlTrailer(p.trailer))}" title="Tráiler de ${esc(p.titulo)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
        })
    }

    /* Fila "También te puede gustar": si no hay relacionadas o falla, quitamos la sección */
    const pintarRelacionadas = () => {
        const seccion = $('[data-element="relacionadas"]')
        api.peliculas.relacionadas(id)
            .then((relacionadas) => {
                if (!relacionadas.length) return seccion.remove()
                $('.Row-track', seccion).innerHTML = relacionadas.map(cardPelicula).join('')
                activarFila(seccion)
            })
            .catch(() => seccion.remove())
    }

    /* Estado vacío con un botón para volver al catálogo */
    const vacio = (tituloVacio, texto) => {
        main.innerHTML = `<div class="Container" style="padding-top:calc(var(--header-h) + 64px)">${estadoVacio(tituloVacio, texto)}<p style="text-align:center;margin-top:1rem"><a class="Button Button--primary" href="catalogo.html">Ir al catálogo</a></p></div>`
    }

    /* ARRANQUE */

    if (!id) return vacio('No has elegido ninguna película', 'Vuelve al catálogo y pulsa sobre un póster.')

    api.peliculas.obtener(id)
        .then((peli) => {
            pintar(peli)
            pintarRelacionadas()
        })
        .catch((error) => {
            if (error.status === 404 || error.status === 400) return vacio('Esta película no existe', 'Puede que se haya retirado del catálogo.')
            main.innerHTML = `<div class="Container" style="padding-top:calc(var(--header-h) + 64px)">${estadoError(error)}</div>`
        })

})()
