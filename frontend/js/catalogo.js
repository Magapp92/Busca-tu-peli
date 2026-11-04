/* Catálogo: los filtros viven en la URL (?genero=&plataforma=&q=&orden=) y cada cambio pide a la API */
import { api } from './api.js'
import { $, esc, PLATAFORMAS, cardPelicula, skeletonCards, estadoVacio, estadoError } from './ui.js'

const params = new URLSearchParams(location.search)
const filtros = {
    q: params.get('q') || '',
    genero: params.get('genero') || '',
    plataforma: params.get('plataforma') || '',
    orden: params.get('orden') || 'titulo'
}

const grid = $('[data-grid]')
const resumen = $('[data-resumen]')
const limpiar = $('[data-limpiar]')
const orden = $('[data-orden]')

const sincronizarUrl = () => {
    const p = new URLSearchParams()
    Object.entries(filtros).forEach(([k, v]) => { if (v && !(k === 'orden' && v === 'titulo')) p.set(k, v) })
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname)
}

const pintarChips = (generos) => {
    $('[data-plataformas]').innerHTML = [['', { nombre: 'Todas' }], ...Object.entries(PLATAFORMAS)].map(([clave, p]) => `
        <button class="chip${filtros.plataforma === clave ? ' is-active' : ''}" data-plataforma="${clave}" aria-pressed="${filtros.plataforma === clave}">
            ${p.logo ? `<img src="${p.logo}" alt="">` : ''}${esc(p.nombre)}
        </button>`).join('')

    $('[data-generos]').innerHTML = ['', ...generos].map((g) => `
        <button class="chip${filtros.genero.toLowerCase() === g.toLowerCase() ? ' is-active' : ''}" data-genero="${esc(g)}" aria-pressed="${filtros.genero.toLowerCase() === g.toLowerCase()}">${g ? esc(g) : 'Todos'}</button>`).join('')
}

const textoResumen = (n) => {
    const partes = []
    if (filtros.q) partes.push(`para “${esc(filtros.q)}”`)
    if (filtros.genero) partes.push(`en ${esc(filtros.genero)}`)
    if (filtros.plataforma) partes.push(`en ${esc(PLATAFORMAS[filtros.plataforma]?.nombre || filtros.plataforma)}`)
    return `<strong>${n}</strong> ${n === 1 ? 'película' : 'películas'} ${partes.join(' ')}`
}

const cargar = async () => {
    sincronizarUrl()
    limpiar.hidden = !(filtros.q || filtros.genero || filtros.plataforma)
    $('[data-titulo]').textContent = filtros.genero || (filtros.plataforma ? PLATAFORMAS[filtros.plataforma]?.nombre : '') || 'Catálogo'
    grid.innerHTML = skeletonCards(12)

    try {
        const pelis = await api.peliculas.listar(filtros)
        resumen.innerHTML = textoResumen(pelis.length)
        grid.innerHTML = pelis.length
            ? pelis.map(cardPelicula).join('')
            : `<div style="grid-column:1/-1">${estadoVacio('No hay películas con estos filtros', 'Prueba con otro género o plataforma.')}</div>`
    } catch (error) {
        resumen.textContent = ''
        grid.innerHTML = `<div style="grid-column:1/-1">${estadoError(error)}</div>`
    }
}

const iniciar = async () => {
    orden.value = filtros.orden
    let generos = []
    try { generos = await api.peliculas.generos() } catch { /* el grid mostrará el error */ }
    pintarChips(generos)

    $('.filters').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip')
        if (!chip) return
        if ('plataforma' in chip.dataset) filtros.plataforma = chip.dataset.plataforma
        if ('genero' in chip.dataset) filtros.genero = chip.dataset.genero
        pintarChips(generos)
        cargar()
    })

    orden.addEventListener('change', () => { filtros.orden = orden.value; cargar() })

    limpiar.addEventListener('click', () => {
        Object.assign(filtros, { q: '', genero: '', plataforma: '' })
        pintarChips(generos)
        cargar()
    })

    cargar()
}

iniciar()
