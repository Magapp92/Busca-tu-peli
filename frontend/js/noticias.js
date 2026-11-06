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
