/* Noticias: el listado llega sin cuerpo; al clicar se pide la noticia completa por id y se abre en un modal.
   ?id= en la URL abre directamente esa noticia (enlaces desde inicio) */

// IIFE que agrupa las noticias para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const noticiasGrid = document.querySelector('[data-element="noticias"]')
    const idInicial = new URLSearchParams(location.search).get('id')

    /* Tarjeta de noticia: la primera va destacada a todo el ancho */
    const tarjeta = (n, i) => `
        <button class="NewsCard${i === 0 ? ' NewsCard--featured' : ''}" data-id="${n._id}">
            <div class="NewsCard-media"><img src="${esc(n.imagen)}" alt="" ${i ? 'loading="lazy"' : ''}></div>
            <div class="NewsCard-body">
                <div class="NewsCard-meta"><span class="Tag Tag--accent">${esc(n.categoria)}</span><time datetime="${n.fecha}">${fechaLarga(n.fecha)}</time></div>
                <h2 class="NewsCard-title">${esc(n.titulo)}</h2>
                <p class="NewsCard-text">${esc(n.entradilla)}</p>
                <span class="NewsCard-more">Leer noticia →</span>
            </div>
        </button>`

    /* Nota de TMDB con un decimal y votos con separador de miles */
    const textoNota = (r) => r.votos
        ? `★ ${r.valoracion.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} · ${r.votos.toLocaleString('es-ES')} votos`
        : 'Sin votos todavía'

    /* Fila del ranking: la película enlaza con su ficha y muestra dónde verla.
       Si todavía no está en ninguna plataforma (un estreno de cine) lo indicamos en lugar de dejar el hueco vacío */
    const filaRanking = (r) => {
        const logos = r.plataformas
            .map((clave) => PLATAFORMAS[clave] ? `<img src="${PLATAFORMAS[clave].logo}" alt="${PLATAFORMAS[clave].nombre}" title="${PLATAFORMAS[clave].nombre}">` : '')
            .join('') || '<span class="Ranking-missing">Aún no está en streaming</span>'
        const contenido = `
            <span class="Ranking-position">${r.posicion}</span>
            <img class="Ranking-poster" src="${esc(r.poster)}" alt="" loading="lazy">
            <span class="Ranking-info">
                <strong class="Ranking-title">${esc(r.titulo)}${r.anio ? ` <span>(${r.anio})</span>` : ''}</strong>
                <span class="Ranking-score">${textoNota(r)}</span>
            </span>
            ${r.pelicula
                ? `<span class="Ranking-platforms">${logos}</span>`
                : '<span class="Ranking-missing">No está en el catálogo</span>'}`

        return `<li>${r.pelicula
            ? `<a class="Ranking-item" href="pelicula.html?id=${r.pelicula}" title="Ver la ficha de ${esc(r.titulo)}">${contenido}</a>`
            : `<div class="Ranking-item">${contenido}</div>`}</li>`
    }

    /* Pedimos la noticia completa y la abrimos en el modal; al cerrarlo quitamos ?id= de la URL */
    const abrirNoticia = (id) => {
        api.noticias.obtener(id)
            .then((n) => {
                history.replaceState(null, '', `?id=${id}`)
                abrirModal(`
                    <article class="Article">
                        ${n.imagen ? `<div class="Article-hero"><img src="${esc(n.imagen)}" alt=""></div>` : ''}
                        <div class="Article-body">
                            <div class="NewsCard-meta"><span class="Tag Tag--accent">${esc(n.categoria)}</span><time datetime="${n.fecha}">${fechaLarga(n.fecha)}</time></div>
                            <h2>${esc(n.titulo)}</h2>
                            <p class="Article-lead">${esc(n.entradilla)}</p>
                            ${n.parrafos.map((p) => `<p>${esc(p)}</p>`).join('')}
                            ${n.ranking?.length ? `<ol class="Ranking">${n.ranking.map(filaRanking).join('')}</ol>` : ''}
                            ${n.lista.length ? `<ol class="Article-list">${n.lista.map((li) => `<li>${esc(li)}</li>`).join('')}</ol>` : ''}
                        </div>
                    </article>`, { onClose: () => history.replaceState(null, '', location.pathname) })
            })
            .catch((error) => toast(error.message, 'error'))
    }

    /* Pintamos el listado y, si todo va bien, activamos los clics y abrimos la noticia de la URL */
    api.noticias.listar()
        .then((noticias) => {
            noticiasGrid.innerHTML = noticias.length
                ? noticias.map(tarjeta).join('')
                : `<div style="grid-column:1/-1">${estadoVacio('Todavía no hay noticias')}</div>`

            noticiasGrid.addEventListener('click', (e) => {
                const card = e.target.closest('[data-id]')
                if (card) abrirNoticia(card.dataset.id)
            })

            if (idInicial) abrirNoticia(idInicial)
        })
        .catch((error) => {
            noticiasGrid.innerHTML = `<div style="grid-column:1/-1">${estadoError(error)}</div>`
        })

})()
