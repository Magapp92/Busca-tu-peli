/* Catálogo: los filtros viven en la URL (?genero=&plataforma=&q=&orden=) y cada cambio pide a la API */

// IIFE que agrupa el catálogo para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const titulo = document.querySelector('[data-element="titulo"]')
    const resumen = document.querySelector('[data-element="resumen"]')
    const limpiar = document.querySelector('[data-element="limpiar"]')
    const orden = document.querySelector('[data-element="orden"]')
    const grid = document.querySelector('[data-element="grid"]')
    const chipsPlataformas = document.querySelector('[data-element="plataformas"]')
    const chipsGeneros = document.querySelector('[data-element="generos"]')
    const filtrosBar = document.querySelector('.Filters')

    /* Leemos los filtros iniciales de la URL */
    const params = new URLSearchParams(location.search)
    const filtros = {
        q: params.get('q') || '',
        genero: params.get('genero') || '',
        plataforma: params.get('plataforma') || '',
        orden: params.get('orden') || 'titulo'
    }

    let generos = []

    /* Reflejamos los filtros en la URL (sin recargar) para poder compartirla o refrescar */
    const sincronizarUrl = () => {
        const p = new URLSearchParams()
        Object.entries(filtros).forEach(([k, v]) => { if (v && !(k === 'orden' && v === 'titulo')) p.set(k, v) })
        history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname)
    }

    /* Chips de plataformas y géneros marcando el filtro activo */
    const pintarChips = () => {
        chipsPlataformas.innerHTML = [['', { nombre: 'Todas' }], ...Object.entries(PLATAFORMAS)].map(([clave, p]) => `
            <button class="Chip${filtros.plataforma === clave ? ' isActive' : ''}" data-plataforma="${clave}" aria-pressed="${filtros.plataforma === clave}">
                ${p.logo ? `<img src="${p.logo}" alt="">` : ''}${esc(p.nombre)}
            </button>`).join('')

        chipsGeneros.innerHTML = ['', ...generos].map((g) => `
            <button class="Chip${filtros.genero.toLowerCase() === g.toLowerCase() ? ' isActive' : ''}" data-genero="${esc(g)}" aria-pressed="${filtros.genero.toLowerCase() === g.toLowerCase()}">${g ? esc(g) : 'Todos'}</button>`).join('')
    }

    /* Texto del tipo "12 películas para “dune” en Drama" */
    const textoResumen = (n) => {
        const partes = []
        if (filtros.q) partes.push(`para “${esc(filtros.q)}”`)
        if (filtros.genero) partes.push(`en ${esc(filtros.genero)}`)
        if (filtros.plataforma) partes.push(`en ${esc(PLATAFORMAS[filtros.plataforma]?.nombre || filtros.plataforma)}`)
        return `<strong>${n}</strong> ${n === 1 ? 'película' : 'películas'} ${partes.join(' ')}`
    }

    /* Pedimos las películas con los filtros actuales y pintamos el grid */
    const cargar = () => {
        sincronizarUrl()
        limpiar.hidden = !(filtros.q || filtros.genero || filtros.plataforma)
        titulo.textContent = filtros.genero || (filtros.plataforma ? PLATAFORMAS[filtros.plataforma]?.nombre : '') || 'Catálogo'
        grid.innerHTML = skeletonCards(12)

        api.peliculas.listar(filtros)
            .then((pelis) => {
                resumen.innerHTML = textoResumen(pelis.length)
                grid.innerHTML = pelis.length
                    ? pelis.map(cardPelicula).join('')
                    : `<div style="grid-column:1/-1">${estadoVacio('No hay películas con estos filtros', 'Prueba con otro género o plataforma.')}</div>`
            })
            .catch((error) => {
                resumen.textContent = ''
                grid.innerHTML = `<div style="grid-column:1/-1">${estadoError(error)}</div>`
            })
    }

    /* Al pulsar un chip cambiamos el filtro y volvemos a cargar */
    filtrosBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.Chip')
        if (!chip) return
        if ('plataforma' in chip.dataset) filtros.plataforma = chip.dataset.plataforma
        if ('genero' in chip.dataset) filtros.genero = chip.dataset.genero
        pintarChips()
        cargar()
    })

    orden.addEventListener('change', () => { filtros.orden = orden.value; cargar() })

    limpiar.addEventListener('click', () => {
        Object.assign(filtros, { q: '', genero: '', plataforma: '' })
        pintarChips()
        cargar()
    })

    /* Arranque: primero los géneros para los chips (si fallan, el grid mostrará el error) y luego las películas */
    orden.value = filtros.orden
    api.peliculas.generos()
        .then((lista) => { generos = lista })
        .catch(() => { /* el grid mostrará el error */ })
        .then(() => {
            pintarChips()
            cargar()
        })

})()
