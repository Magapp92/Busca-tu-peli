/* Panel de administración: usa todo el CRUD de la API
   Películas: GET, POST, PUT (editar), PATCH (destacada), DELETE
   Noticias: GET, GET por id (para editar el cuerpo), POST, PUT, DELETE
   Sugerencias: GET (filtro por estado), PATCH (estado), DELETE */

// IIFE que agrupa el panel para no dejar variables globales
(() => {

    /* Creamos las constantes que vamos a utilizar */
    const tabs = document.querySelectorAll('[data-tab]')
    const panels = document.querySelectorAll('[data-panel]')
    const filtroPeliculas = document.querySelector('[data-element="filtro-peliculas"]')
    const filtroEstado = document.querySelector('[data-element="filtro-estado"]')
    const tablaPeliculas = document.querySelector('[data-tabla="peliculas"]')
    const tablaNoticias = document.querySelector('[data-tabla="noticias"]')
    const tablaRecomendaciones = document.querySelector('[data-tabla="recomendaciones"]')
    const drawer = document.querySelector('[data-element="drawer"]')
    const drawerForm = document.querySelector('[data-element="drawer-form"]')
    const drawerBody = document.querySelector('[data-element="drawer-body"]')
    const drawerTitle = document.querySelector('#drawer-title')
    const guardar = document.querySelector('[data-element="guardar"]')
    const cerrarDrawerButtons = document.querySelectorAll('[data-element="cerrar-drawer"]')

    /* Datos cargados de la API y lo que se está editando en el drawer: { tipo, id } */
    const estado = { peliculas: [], noticias: [], recomendaciones: [] }
    let edicion = null

    /* Convierten el texto de los campos en listas */
    const aLista = (texto) => texto.split(',').map((s) => s.trim()).filter(Boolean)
    const aLineas = (texto) => texto.split('\n').map((s) => s.trim()).filter(Boolean)


    /* PESTAÑAS */

    /* Al pulsar una pestaña la marcamos y mostramos solo su panel */
    tabs.forEach((tab) => tab.addEventListener('click', () => {
        tabs.forEach((t) => { t.classList.toggle('isActive', t === tab); t.setAttribute('aria-selected', t === tab) })
        panels.forEach((p) => { p.hidden = p.dataset.panel !== tab.dataset.tab })
    }))

    /* Número de elementos en cada pestaña */
    const contar = () => Object.keys(estado).forEach((k) => { $(`[data-count="${k}"]`).textContent = estado[k].length })

    const filaError = (tbody, cols, error) => {
        tbody.innerHTML = `<tr><td colspan="${cols}"><div class="State State--error" style="border:0">${ICON.alert}<strong>No se pudo cargar</strong><p>${esc(error.message)}</p></div></td></tr>`
    }


    /* PELÍCULAS */

    /* Tabla de películas filtrada por el texto del buscador */
    const pintarPeliculas = () => {
        const filtro = filtroPeliculas.value.trim().toLowerCase()
        const lista = estado.peliculas.filter((p) => p.titulo.toLowerCase().includes(filtro))
        tablaPeliculas.innerHTML = lista.map((p) => `
            <tr>
                <td><img class="Table-thumb" src="${esc(p.poster)}" alt=""></td>
                <td><a class="Table-title" href="pelicula.html?id=${p._id}" target="_blank">${esc(p.titulo)}</a><div class="Table-subtitle">${esc(p.anio)} · ${esc(p.direccion.join(', '))}</div></td>
                <td class="Table-subtitle">${esc(p.generos.join(', '))}</td>
                <td><div class="Table-logos">${p.plataformas.map((pl) => PLATAFORMAS[pl.clave] ? `<img src="${PLATAFORMAS[pl.clave].logo}" alt="${PLATAFORMAS[pl.clave].nombre}" title="${PLATAFORMAS[pl.clave].nombre}">` : '').join('')}</div></td>
                <td><button class="Switch" role="switch" aria-checked="${p.destacada}" aria-label="Destacar ${esc(p.titulo)}" data-destacar="${p._id}"></button></td>
                <td><div class="Table-actions">
                    <button class="Button Button--outline Button--small" data-editar="peliculas" data-id="${p._id}">Editar</button>
                    <button class="Button Button--danger Button--small" data-borrar="peliculas" data-id="${p._id}" aria-label="Borrar ${esc(p.titulo)}">Borrar</button>
                </div></td>
            </tr>`).join('') || '<tr><td colspan="6" class="Table-subtitle" style="text-align:center;padding:2rem">Sin resultados</td></tr>'
    }

    const cargarPeliculas = () => api.peliculas.listar({ orden: 'titulo' })
        .then((pelis) => {
            estado.peliculas = pelis
            pintarPeliculas()
        })
        .catch((error) => filaError(tablaPeliculas, 6, error))
        .then(contar)

    /* Formulario de película para crear o editar */
    const formPelicula = (p = {}) => {
        const v = (k) => esc(p[k] ?? '')
        const l = (k) => esc((p[k] || []).join(', '))
        const plats = Object.fromEntries((p.plataformas || []).map((pl) => [pl.clave, pl.url]))
        return `
        <div class="Form">
            <div class="Form-grid">
                <div class="Field Field--wide"><label for="f-titulo">Título *</label><input class="Input" id="f-titulo" name="titulo" value="${v('titulo')}" required></div>
                <div class="Field"><label for="f-original">Título original</label><input class="Input" id="f-original" name="tituloOriginal" value="${v('tituloOriginal')}"></div>
                <div class="Field"><label for="f-pais">País</label><input class="Input" id="f-pais" name="pais" value="${v('pais')}"></div>
                <div class="Field"><label for="f-anio">Año</label><input class="Input" id="f-anio" name="anio" type="number" min="1888" max="2100" value="${v('anio')}"></div>
                <div class="Field"><label for="f-dur">Duración (min)</label><input class="Input" id="f-dur" name="duracionMin" type="number" min="0" value="${v('duracionMin')}"></div>
                <div class="Field Field--wide"><label for="f-sinopsis">Sinopsis *</label><textarea class="Input" id="f-sinopsis" name="sinopsis" required>${v('sinopsis')}</textarea></div>
                <div class="Field Field--wide"><label for="f-generos">Géneros</label><input class="Input" id="f-generos" name="generos" value="${l('generos')}" placeholder="Acción, Comedia"><small>Separados por comas</small></div>
                <div class="Field"><label for="f-dir">Dirección</label><input class="Input" id="f-dir" name="direccion" value="${l('direccion')}"></div>
                <div class="Field"><label for="f-guion">Guion</label><input class="Input" id="f-guion" name="guion" value="${l('guion')}"></div>
                <div class="Field Field--wide"><label for="f-reparto">Reparto</label><input class="Input" id="f-reparto" name="reparto" value="${l('reparto')}"></div>
                <div class="Field Field--wide"><label for="f-comp">Productoras</label><input class="Input" id="f-comp" name="companias" value="${l('companias')}"></div>
                <div class="Field Field--wide"><label for="f-poster">Póster (ruta o URL) *</label><input class="Input" id="f-poster" name="poster" value="${v('poster')}" placeholder="assets/plataformas/... o https://..." required></div>
                <div class="Field Field--wide"><label for="f-backdrop">Imagen horizontal (hero)</label><input class="Input" id="f-backdrop" name="backdrop" value="${v('backdrop')}"></div>
                <div class="Field Field--wide"><label for="f-trailer">Tráiler (URL embed de YouTube)</label><input class="Input" id="f-trailer" name="trailer" value="${v('trailer')}" placeholder="https://www.youtube.com/embed/XXXX"></div>
            </div>
            <fieldset class="Field">
                <legend>Dónde ver</legend>
                <div class="PlatformPick">
                    ${Object.entries(PLATAFORMAS).map(([clave, info]) => `
                    <div class="PlatformPick-row">
                        <label class="Check"><input type="checkbox" name="pl-${clave}" ${plats[clave] ? 'checked' : ''} data-pl="${clave}"><img src="${info.logo}" alt="">${info.nombre}</label>
                        <input class="Input" name="url-${clave}" value="${esc(plats[clave] || '')}" placeholder="URL en ${info.nombre}" aria-label="URL en ${info.nombre}" ${plats[clave] ? '' : 'disabled'}>
                    </div>`).join('')}
                </div>
            </fieldset>
            <label class="Check"><input type="checkbox" name="destacada" ${p.destacada ? 'checked' : ''}> Destacar en la portada</label>
        </div>`
    }

    /* Leemos el formulario y lo convertimos en el cuerpo que espera la API */
    const leerPelicula = (f) => ({
        titulo: f.titulo.value.trim(),
        tituloOriginal: f.tituloOriginal.value.trim(),
        pais: f.pais.value.trim(),
        anio: f.anio.value ? Number(f.anio.value) : undefined,
        duracionMin: f.duracionMin.value ? Number(f.duracionMin.value) : undefined,
        sinopsis: f.sinopsis.value.trim(),
        generos: aLista(f.generos.value),
        direccion: aLista(f.direccion.value),
        guion: aLista(f.guion.value),
        reparto: aLista(f.reparto.value),
        companias: aLista(f.companias.value),
        poster: f.poster.value.trim(),
        backdrop: f.backdrop.value.trim(),
        trailer: f.trailer.value.trim(),
        destacada: f.destacada.checked,
        plataformas: Object.keys(PLATAFORMAS)
            .filter((k) => f[`pl-${k}`].checked)
            .map((k) => ({ clave: k, url: f[`url-${k}`].value.trim() || `https://www.google.com/search?q=${encodeURIComponent(f.titulo.value)}` }))
    })


    /* NOTICIAS */

    const pintarNoticias = () => {
        tablaNoticias.innerHTML = estado.noticias.map((n) => `
            <tr>
                <td><img class="Table-thumb Table-thumb--wide" src="${esc(n.imagen)}" alt=""></td>
                <td><a class="Table-title" href="noticias.html?id=${n._id}" target="_blank">${esc(n.titulo)}</a></td>
                <td><span class="Tag Tag--accent">${esc(n.categoria)}</span></td>
                <td class="Table-subtitle">${fechaLarga(n.fecha)}</td>
                <td><div class="Table-actions">
                    <button class="Button Button--outline Button--small" data-editar="noticias" data-id="${n._id}">Editar</button>
                    <button class="Button Button--danger Button--small" data-borrar="noticias" data-id="${n._id}" aria-label="Borrar ${esc(n.titulo)}">Borrar</button>
                </div></td>
            </tr>`).join('') || '<tr><td colspan="5" class="Table-subtitle" style="text-align:center;padding:2rem">Todavía no hay noticias</td></tr>'
    }

    const cargarNoticias = () => api.noticias.listar()
        .then((noticias) => {
            estado.noticias = noticias
            pintarNoticias()
        })
        .catch((error) => filaError(tablaNoticias, 5, error))
        .then(contar)

    /* Formulario de noticia para crear o editar */
    const formNoticia = (n = {}) => `
        <div class="Form">
            <div class="Field"><label for="n-titulo">Título *</label><input class="Input" id="n-titulo" name="titulo" value="${esc(n.titulo || '')}" required></div>
            <div class="Form-grid">
                <div class="Field"><label for="n-cat">Categoría</label><input class="Input" id="n-cat" name="categoria" value="${esc(n.categoria || '')}" placeholder="Estrenos"></div>
                <div class="Field"><label for="n-fecha">Fecha</label><input class="Input" id="n-fecha" name="fecha" type="date" value="${(n.fecha || new Date().toISOString()).slice(0, 10)}"></div>
            </div>
            <div class="Field"><label for="n-img">Imagen (ruta o URL)</label><input class="Input" id="n-img" name="imagen" value="${esc(n.imagen || '')}"></div>
            <div class="Field"><label for="n-entr">Entradilla *</label><textarea class="Input" id="n-entr" name="entradilla" required>${esc(n.entradilla || '')}</textarea></div>
            <div class="Field"><label for="n-cuerpo">Cuerpo</label><textarea class="Input" id="n-cuerpo" name="parrafos" style="min-height:220px">${esc((n.parrafos || []).join('\n\n'))}</textarea><small>Un párrafo por línea</small></div>
            <div class="Field"><label for="n-lista">Lista numerada (opcional)</label><textarea class="Input" id="n-lista" name="lista">${esc((n.lista || []).join('\n'))}</textarea><small>Un elemento por línea</small></div>
        </div>`

    const leerNoticia = (f) => ({
        titulo: f.titulo.value.trim(),
        categoria: f.categoria.value.trim() || 'General',
        fecha: f.fecha.value || undefined,
        imagen: f.imagen.value.trim(),
        entradilla: f.entradilla.value.trim(),
        parrafos: aLineas(f.parrafos.value),
        lista: aLineas(f.lista.value)
    })


    /* SUGERENCIAS */

    const pintarRecomendaciones = () => {
        tablaRecomendaciones.innerHTML = estado.recomendaciones.map((r) => `
            <tr>
                <td class="Table-title">${esc(r.pelicula)}</td>
                <td>${esc(r.nombre)}<div class="Table-subtitle">${esc(r.email)}</div></td>
                <td class="Table-subtitle">${fechaLarga(r.createdAt)}</td>
                <td>
                    <label class="u-srOnly" for="e-${r._id}">Estado</label>
                    <select class="Select StatusSelect" id="e-${r._id}" data-estado="${esc(r.estado)}" data-id="${r._id}">
                        ${['pendiente', 'añadida', 'descartada'].map((e) => `<option value="${e}" ${r.estado === e ? 'selected' : ''}>${e[0].toUpperCase() + e.slice(1)}</option>`).join('')}
                    </select>
                </td>
                <td><div class="Table-actions"><button class="Button Button--danger Button--small" data-borrar="recomendaciones" data-id="${r._id}">Borrar</button></div></td>
            </tr>`).join('') || '<tr><td colspan="5" class="Table-subtitle" style="text-align:center;padding:2rem">No hay sugerencias</td></tr>'
    }

    const cargarRecomendaciones = () => api.recomendaciones.listar({ estado: filtroEstado.value })
        .then((recomendaciones) => {
            estado.recomendaciones = recomendaciones
            pintarRecomendaciones()
        })
        .catch((error) => filaError(tablaRecomendaciones, 5, error))
        .then(contar)


    /* DRAWER DE CREACIÓN / EDICIÓN */

    /* Abrimos el panel lateral con el formulario vacío (nuevo) o relleno (editar) */
    const abrirDrawer = (tipo, id) => {
        edicion = { tipo, id }
        const nombre = tipo === 'peliculas' ? 'película' : 'noticia'
        drawerTitle.textContent = id ? `Editar ${nombre}` : `Nueva ${nombre}`

        /* El listado de noticias no trae el cuerpo: pedimos la noticia completa */
        const datos = id && tipo === 'noticias'
            ? api.noticias.obtener(id)
            : Promise.resolve(id && tipo === 'peliculas' ? estado.peliculas.find((p) => p._id === id) : {})

        datos
            .then((d) => {
                /* Guardamos el documento original para conservar al guardar los campos que no están en el formulario */
                edicion.original = d
                drawerBody.innerHTML = tipo === 'peliculas' ? formPelicula(d) : formNoticia(d)
                drawer.classList.add('isOpen')
                drawer.setAttribute('aria-hidden', 'false')
                document.body.style.overflow = 'hidden'
                drawerForm.querySelector('input')?.focus()
            })
            .catch((error) => toast(error.message, 'error'))
    }

    const cerrarDrawer = () => {
        drawer.classList.remove('isOpen')
        drawer.setAttribute('aria-hidden', 'true')
        document.body.style.overflow = ''
        edicion = null
    }

    cerrarDrawerButtons.forEach((b) => b.addEventListener('click', cerrarDrawer))
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('isOpen')) cerrarDrawer() })

    /* Habilita la URL de cada plataforma al marcarla */
    drawerForm.addEventListener('change', (e) => {
        const k = e.target.dataset.pl
        if (k) {
            const url = drawerForm[`url-${k}`]
            url.disabled = !e.target.checked
            if (e.target.checked) url.focus()
        }
    })

    /* Guardamos: comprobamos los obligatorios y usamos PUT (editar) o POST (crear) */
    drawerForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const faltan = $$('[required]', drawerForm).filter((c) => !c.value.trim())
        $$('.Field', drawerForm).forEach((f) => f.classList.remove('hasError'))
        if (faltan.length) {
            faltan.forEach((c) => c.closest('.Field').classList.add('hasError'))
            faltan[0].focus()
            return toast('Rellena los campos obligatorios', 'error')
        }

        const { tipo, id, original = {} } = edicion
        const recurso = api[tipo]
        const body = tipo === 'peliculas' ? leerPelicula(drawerForm) : leerNoticia(drawerForm)
        /* El PUT reemplaza el documento: conservamos los datos que no se editan en el formulario
           (id y valoración de TMDB en películas; clave y ranking en las noticias generadas) */
        const conservar = tipo === 'peliculas' ? ['tmdbId', 'valoracion', 'votos', 'popularidad'] : ['clave', 'ranking']
        if (id) conservar.forEach((campo) => { if (original[campo] !== undefined) body[campo] = original[campo] })

        guardar.disabled = true
        const peticion = id ? recurso.reemplazar(id, body) : recurso.crear(body)
        peticion
            .then(() => {
                toast(id ? 'Cambios guardados' : 'Creado correctamente')
                cerrarDrawer()
                tipo === 'peliculas' ? cargarPeliculas() : cargarNoticias()
            })
            .catch((error) => toast(error.message, 'error'))
            .finally(() => { guardar.disabled = false })
    })


    /* CONFIRMACIÓN DE BORRADO */

    /* Modal con Cancelar / Sí, borrar: la promesa se resuelve con true si se confirma */
    const confirmar = (texto) => new Promise((resolve) => {
        let respuesta = false
        abrirModal(`
            <div class="Confirm">
                <h2>¿Seguro que quieres borrarlo?</h2>
                <p>${esc(texto)} Esta acción no se puede deshacer.</p>
                <div class="Confirm-actions">
                    <button class="Button Button--outline" data-element="no">Cancelar</button>
                    <button class="Button Button--danger" data-element="si">Sí, borrar</button>
                </div>
            </div>`, { onClose: () => resolve(respuesta) })
        $('.Modal [data-element="si"]').addEventListener('click', () => { respuesta = true; cerrarModal() })
        $('.Modal [data-element="no"]').addEventListener('click', cerrarModal)
    })


    /* IMPORTAR DESDE TMDB */

    /* Fila de resultado: si ya está en el catálogo no se puede volver a añadir */
    const resultadoTmdb = (r) => `
        <li class="TmdbImport-item">
            ${r.poster ? `<img src="${esc(r.poster)}" alt="" loading="lazy">` : '<div class="TmdbImport-noImage">Sin póster</div>'}
            <div class="TmdbImport-info">
                <strong>${esc(r.titulo)}</strong>
                <span>${esc(r.anio ?? 's/f')}${r.tituloOriginal && r.tituloOriginal !== r.titulo ? ` · ${esc(r.tituloOriginal)}` : ''}</span>
            </div>
            ${r.enCatalogo
                ? '<span class="Tag">En el catálogo</span>'
                : `<button class="Button Button--primary Button--small" data-tmdb-importar="${r.tmdbId}">Añadir</button>`}
        </li>`

    const abrirImportador = () => {
        abrirModal(`
            <div class="TmdbImport">
                <h2>Importar desde TMDB</h2>
                <p class="Section-subtitle">Busca una película y añádela con su ficha, póster, tráiler y plataformas en España.</p>
                <form class="TmdbImport-form" data-element="tmdb-form">
                    <label class="u-srOnly" for="tmdb-q">Título</label>
                    <input class="Input" id="tmdb-q" placeholder="Por ejemplo: Oppenheimer" autocomplete="off">
                    <button class="Button Button--primary" type="submit">Buscar</button>
                </form>
                <ul class="TmdbImport-list" data-element="tmdb-resultados"></ul>
            </div>`)
        const tmdbForm = $('[data-element="tmdb-form"]')
        const tmdbLista = $('[data-element="tmdb-resultados"]')
        const tmdbInput = $('#tmdb-q')
        tmdbInput.focus()

        /* Buscamos en TMDB a través de nuestra API */
        tmdbForm.addEventListener('submit', (e) => {
            e.preventDefault()
            const q = tmdbInput.value.trim()
            if (q.length < 2) return toast('Escribe al menos 2 letras', 'error')
            tmdbLista.innerHTML = '<li class="Section-subtitle">Buscando…</li>'
            api.tmdb.buscar(q)
                .then((resultados) => {
                    tmdbLista.innerHTML = resultados.length ? resultados.map(resultadoTmdb).join('') : '<li class="Section-subtitle">Sin resultados en TMDB</li>'
                })
                .catch((error) => {
                    tmdbLista.innerHTML = `<li class="Alert Alert--error">${ICON.alert}<span>${esc(error.message)}</span></li>`
                })
        })

        /* Añadimos la película elegida al catálogo */
        tmdbLista.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-tmdb-importar]')
            if (!btn) return
            btn.disabled = true
            btn.textContent = 'Añadiendo…'
            api.tmdb.importar(btn.dataset.tmdbImportar)
                .then((peli) => {
                    btn.outerHTML = '<span class="Tag Tag--accent">Añadida</span>'
                    const donde = peli.plataformas.map((pl) => PLATAFORMAS[pl.clave]?.nombre).filter(Boolean).join(', ')
                    toast(donde ? `${peli.titulo} añadida · ${donde}` : `${peli.titulo} añadida (sin plataforma en España)`)
                    cargarPeliculas()
                })
                .catch((error) => {
                    btn.disabled = false
                    btn.textContent = 'Añadir'
                    toast(error.message, 'error')
                })
        })
    }


    /* DELEGACIÓN DE EVENTOS */

    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-element="importar-tmdb"]')) return abrirImportador()

        const nueva = e.target.closest('[data-nueva]')
        if (nueva) return abrirDrawer(nueva.dataset.nueva)

        const editar = e.target.closest('[data-editar]')
        if (editar) return abrirDrawer(editar.dataset.editar, editar.dataset.id)

        /* Interruptor de destacada: cambiamos ya y si la API falla lo devolvemos */
        const destacar = e.target.closest('[data-destacar]')
        if (destacar) {
            const valor = destacar.getAttribute('aria-checked') !== 'true'
            destacar.setAttribute('aria-checked', valor)
            api.peliculas.modificar(destacar.dataset.destacar, { destacada: valor })
                .then((actualizada) => {
                    Object.assign(estado.peliculas.find((p) => p._id === actualizada._id), actualizada)
                    toast(valor ? `${actualizada.titulo} aparece en la portada` : `${actualizada.titulo} ya no está destacada`)
                })
                .catch((error) => {
                    destacar.setAttribute('aria-checked', !valor)
                    toast(error.message, 'error')
                })
            return
        }

        /* Borrar: pedimos confirmación, borramos en la API y quitamos la fila */
        const borrar = e.target.closest('[data-borrar]')
        if (borrar) {
            const { borrar: tipo, id } = borrar.dataset
            const item = estado[tipo].find((x) => x._id === id)
            confirmar(`Vas a borrar “${item.titulo || item.pelicula}”.`)
                .then((ok) => {
                    if (!ok) return
                    return api[tipo].borrar(id)
                        .then(() => {
                            estado[tipo] = estado[tipo].filter((x) => x._id !== id)
                            const pintores = { peliculas: pintarPeliculas, noticias: pintarNoticias, recomendaciones: pintarRecomendaciones }
                            pintores[tipo]()
                            contar()
                            toast('Borrado correctamente')
                        })
                        .catch((error) => toast(error.message, 'error'))
                })
        }
    })

    /* Cambio de estado de una sugerencia */
    document.addEventListener('change', (e) => {
        const select = e.target.closest('select.StatusSelect')
        if (!select) return
        api.recomendaciones.modificar(select.dataset.id, { estado: select.value })
            .then(() => {
                select.dataset.estado = select.value
                toast('Estado actualizado')
            })
            .catch((error) => toast(error.message, 'error'))
    })

    filtroPeliculas.addEventListener('input', pintarPeliculas)
    filtroEstado.addEventListener('change', cargarRecomendaciones)


    /* ACCESO CON CLAVE DE ADMINISTRADOR */

    /* Sustituimos el panel por el formulario de clave; si es correcta la API devuelve un token (8 h),
       lo guardamos en la sesión y recargamos */
    const pedirClave = (mensaje = '') => {
        $('main').innerHTML = `
            <div class="PageHead" style="max-width:440px;margin-inline:auto">
                <h1 class="PageHead-title" style="font-size:2rem">Administración</h1>
                <p class="PageHead-text">Introduce la clave de administrador para gestionar el catálogo.</p>
                <form class="Form FormCard" style="margin-top:1.4rem" data-element="login" novalidate>
                    <div class="Field${mensaje ? ' hasError' : ''}">
                        <label for="clave-admin">Clave</label>
                        <input class="Input" id="clave-admin" type="password" autocomplete="current-password" required>
                        <span class="Field-error" aria-live="polite">${esc(mensaje)}</span>
                    </div>
                    <button class="Button Button--primary" type="submit">Entrar</button>
                </form>
            </div>`
        const claveInput = $('#clave-admin')
        claveInput.focus()
        $('[data-element="login"]').addEventListener('submit', (e) => {
            e.preventDefault()
            const clave = claveInput.value.trim()
            if (!clave) return pedirClave('Escribe la clave')
            api.admin.login(clave)
                .then(({ token }) => {
                    sesionAdmin.guardar(token)
                    location.reload()
                })
                .catch((error) => pedirClave(error.status === 401 ? 'Clave incorrecta' : error.message))
        })
    }

    /* ARRANQUE: comprobamos el token guardado antes de cargar los datos */
    api.admin.verificar()
        .then(() => {
            cargarPeliculas()
            cargarNoticias()
            cargarRecomendaciones()
        })
        .catch((error) => {
            sesionAdmin.borrar()
            pedirClave(error.status === 401 ? '' : error.message)
        })

})()
