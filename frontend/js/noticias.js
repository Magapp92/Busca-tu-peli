/* Noticias: el listado llega sin cuerpo; al clicar se pide la noticia completa por id y se abre en un modal.
   ?id= en la URL abre directamente esa noticia (enlaces desde inicio) */
import { api } from './api.js'
import { $, esc, abrirModal, fechaLarga, estadoError, estadoVacio, toast } from './ui.js'

const cont = $('[data-noticias]')

const tarjeta = (n, i) => `
    <button class="news-card${i === 0 ? ' news-card--featured' : ''}" data-id="${n._id}">
        <div class="news-card__media"><img src="${esc(n.imagen)}" alt="" ${i ? 'loading="lazy"' : ''}></div>
        <div class="news-card__body">
            <div class="news-card__meta"><span class="tag tag--accent">${esc(n.categoria)}</span><time datetime="${n.fecha}">${fechaLarga(n.fecha)}</time></div>
            <h2 class="news-card__title">${esc(n.titulo)}</h2>
            <p class="news-card__text">${esc(n.entradilla)}</p>
            <span class="news-card__more">Leer noticia →</span>
        </div>
    </button>`

const abrirNoticia = async (id) => {
    try {
        const n = await api.noticias.obtener(id)
        history.replaceState(null, '', `?id=${id}`)
        abrirModal(`
            <article>
                ${n.imagen ? `<div class="article__hero"><img src="${esc(n.imagen)}" alt=""></div>` : ''}
                <div class="article__body">
                    <div class="news-card__meta"><span class="tag tag--accent">${esc(n.categoria)}</span><time datetime="${n.fecha}">${fechaLarga(n.fecha)}</time></div>
                    <h2>${esc(n.titulo)}</h2>
                    <p class="article__lead">${esc(n.entradilla)}</p>
                    ${n.parrafos.map((p) => `<p>${esc(p)}</p>`).join('')}
                    ${n.lista.length ? `<ol class="article__list">${n.lista.map((li) => `<li>${esc(li)}</li>`).join('')}</ol>` : ''}
                </div>
            </article>`, { onClose: () => history.replaceState(null, '', location.pathname) })
    } catch (error) {
        toast(error.message, 'error')
    }
}

const iniciar = async () => {
    try {
        const noticias = await api.noticias.listar()
        cont.innerHTML = noticias.length
            ? noticias.map(tarjeta).join('')
            : `<div style="grid-column:1/-1">${estadoVacio('Todavía no hay noticias')}</div>`
    } catch (error) {
        cont.innerHTML = `<div style="grid-column:1/-1">${estadoError(error)}</div>`
        return
    }

    cont.addEventListener('click', (e) => {
        const card = e.target.closest('[data-id]')
        if (card) abrirNoticia(card.dataset.id)
    })

    const id = new URLSearchParams(location.search).get('id')
    if (id) abrirNoticia(id)
}

iniciar()
