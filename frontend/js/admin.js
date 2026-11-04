/* Panel de administración: usa todo el CRUD de la API
   Películas: GET, POST, PUT (editar), PATCH (destacada), DELETE
   Noticias: GET, GET por id (para editar el cuerpo), POST, PUT, DELETE
   Sugerencias: GET (filtro por estado), PATCH (estado), DELETE */
import { api, claveAdmin } from './api.js'
import { $, $$, esc, ICON, PLATAFORMAS, abrirModal, cerrarModal, toast, fechaLarga } from './ui.js'

const estado = { peliculas: [], noticias: [], recomendaciones: [] }
let edicion = null // { tipo, id }

const aLista = (texto) => texto.split(',').map((s) => s.trim()).filter(Boolean)
const aLineas = (texto) => texto.split('\n').map((s) => s.trim()).filter(Boolean)

/* ---------- Pestañas ---------- */
$$('[data-tab]').forEach((tab) => tab.addEventListener('click', () => {
    $$('[data-tab]').forEach((t) => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', t === tab) })
    $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== tab.dataset.tab })
}))

const contar = () => Object.keys(estado).forEach((k) => { $(`[data-count="${k}"]`).textContent = estado[k].length })

const filaError = (tbody, cols, error) => {
    tbody.innerHTML = `<tr><td colspan="${cols}"><div class="state state--error" style="border:0">${ICON.alert}<strong>No se pudo cargar</strong><p>${esc(error.message)}</p></div></td></tr>`
}

/* ---------- Películas ---------- */
const pintarPeliculas = () => {
    const filtro = $('[data-filtro-peliculas]').value.trim().toLowerCase()
    const lista = estado.peliculas.filter((p) => p.titulo.toLowerCase().includes(filtro))
    $('[data-tabla="peliculas"]').innerHTML = lista.map((p) => `
        <tr>
            <td><img class="table__thumb" src="${esc(p.poster)}" alt=""></td>
            <td><a class="table__title" href="pelicula.html?id=${p._id}" target="_blank">${esc(p.titulo)}</a><div class="table__sub">${esc(p.anio)} · ${esc(p.direccion.join(', '))}</div></td>
            <td class="table__sub">${esc(p.generos.join(', '))}</td>
            <td><div class="table__logos">${p.plataformas.map((pl) => PLATAFORMAS[pl.clave] ? `<img src="${PLATAFORMAS[pl.clave].logo}" alt="${PLATAFORMAS[pl.clave].nombre}" title="${PLATAFORMAS[pl.clave].nombre}">` : '').join('')}</div></td>
            <td><button class="switch" role="switch" aria-checked="${p.destacada}" aria-label="Destacar ${esc(p.titulo)}" data-destacar="${p._id}"></button></td>
            <td><div class="table__actions">
                <button class="btn btn--outline btn--sm" data-editar="peliculas" data-id="${p._id}">Editar</button>
                <button class="btn btn--danger btn--sm" data-borrar="peliculas" data-id="${p._id}" aria-label="Borrar ${esc(p.titulo)}">Borrar</button>
            </div></td>
        </tr>`).join('') || '<tr><td colspan="6" class="table__sub" style="text-align:center;padding:2rem">Sin resultados</td></tr>'
}

const cargarPeliculas = async () => {
    try {
        estado.peliculas = await api.peliculas.listar({ orden: 'titulo' })
        pintarPeliculas()
    } catch (error) {
        filaError($('[data-tabla="peliculas"]'), 6, error)
    }
    contar()
}

const formPelicula = (p = {}) => {
    const v = (k) => esc(p[k] ?? '')
    const l = (k) => esc((p[k] || []).join(', '))
    const plats = Object.fromEntries((p.plataformas || []).map((pl) => [pl.clave, pl.url]))
    return `
    <div class="form">
        <div class="form__grid">
            <div class="field field--wide"><label for="f-titulo">Título *</label><input class="input" id="f-titulo" name="titulo" value="${v('titulo')}" required></div>
            <div class="field"><label for="f-original">Título original</label><input class="input" id="f-original" name="tituloOriginal" value="${v('tituloOriginal')}"></div>
            <div class="field"><label for="f-pais">País</label><input class="input" id="f-pais" name="pais" value="${v('pais')}"></div>
            <div class="field"><label for="f-anio">Año</label><input class="input" id="f-anio" name="anio" type="number" min="1888" max="2100" value="${v('anio')}"></div>
            <div class="field"><label for="f-dur">Duración (min)</label><input class="input" id="f-dur" name="duracionMin" type="number" min="0" value="${v('duracionMin')}"></div>
            <div class="field field--wide"><label for="f-sinopsis">Sinopsis *</label><textarea class="input" id="f-sinopsis" name="sinopsis" required>${v('sinopsis')}</textarea></div>
            <div class="field field--wide"><label for="f-generos">Géneros</label><input class="input" id="f-generos" name="generos" value="${l('generos')}" placeholder="Acción, Comedia"><small>Separados por comas</small></div>
            <div class="field"><label for="f-dir">Dirección</label><input class="input" id="f-dir" name="direccion" value="${l('direccion')}"></div>
            <div class="field"><label for="f-guion">Guion</label><input class="input" id="f-guion" name="guion" value="${l('guion')}"></div>
            <div class="field field--wide"><label for="f-reparto">Reparto</label><input class="input" id="f-reparto" name="reparto" value="${l('reparto')}"></div>
            <div class="field field--wide"><label for="f-comp">Productoras</label><input class="input" id="f-comp" name="companias" value="${l('companias')}"></div>
            <div class="field field--wide"><label for="f-poster">Póster (ruta o URL) *</label><input class="input" id="f-poster" name="poster" value="${v('poster')}" placeholder="assets/plataformas/... o https://..." required></div>
            <div class="field field--wide"><label for="f-backdrop">Imagen horizontal (hero)</label><input class="input" id="f-backdrop" name="backdrop" value="${v('backdrop')}"></div>
            <div class="field field--wide"><label for="f-trailer">Tráiler (URL embed de YouTube)</label><input class="input" id="f-trailer" name="trailer" value="${v('trailer')}" placeholder="https://www.youtube.com/embed/XXXX"></div>
        </div>
        <fieldset class="field">
            <legend>Dónde ver</legend>
            <div class="platform-pick">
                ${Object.entries(PLATAFORMAS).map(([clave, info]) => `
                <div class="platform-pick__row">
                    <label class="check"><input type="checkbox" name="pl-${clave}" ${plats[clave] ? 'checked' : ''} data-pl="${clave}"><img src="${info.logo}" alt="">${info.nombre}</label>
                    <input class="input" name="url-${clave}" value="${esc(plats[clave] || '')}" placeholder="URL en ${info.nombre}" aria-label="URL en ${info.nombre}" ${plats[clave] ? '' : 'disabled'}>
                </div>`).join('')}
            </div>
        </fieldset>
        <label class="check"><input type="checkbox" name="destacada" ${p.destacada ? 'checked' : ''}> Destacar en la portada</label>
    </div>`
}

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

/* ---------- Noticias ---------- */
const pintarNoticias = () => {
    $('[data-tabla="noticias"]').innerHTML = estado.noticias.map((n) => `
        <tr>
            <td><img class="table__thumb table__thumb--wide" src="${esc(n.imagen)}" alt=""></td>
            <td><a class="table__title" href="noticias.html?id=${n._id}" target="_blank">${esc(n.titulo)}</a></td>
            <td><span class="tag tag--accent">${esc(n.categoria)}</span></td>
            <td class="table__sub">${fechaLarga(n.fecha)}</td>
            <td><div class="table__actions">
                <button class="btn btn--outline btn--sm" data-editar="noticias" data-id="${n._id}">Editar</button>
                <button class="btn btn--danger btn--sm" data-borrar="noticias" data-id="${n._id}" aria-label="Borrar ${esc(n.titulo)}">Borrar</button>
            </div></td>
        </tr>`).join('') || '<tr><td colspan="5" class="table__sub" style="text-align:center;padding:2rem">Todavía no hay noticias</td></tr>'
}

const cargarNoticias = async () => {
    try {
        estado.noticias = await api.noticias.listar()
        pintarNoticias()
    } catch (error) {
        filaError($('[data-tabla="noticias"]'), 5, error)
    }
    contar()
}

const formNoticia = (n = {}) => `
    <div class="form">
        <div class="field"><label for="n-titulo">Título *</label><input class="input" id="n-titulo" name="titulo" value="${esc(n.titulo || '')}" required></div>
        <div class="form__grid">
            <div class="field"><label for="n-cat">Categoría</label><input class="input" id="n-cat" name="categoria" value="${esc(n.categoria || '')}" placeholder="Estrenos"></div>
            <div class="field"><label for="n-fecha">Fecha</label><input class="input" id="n-fecha" name="fecha" type="date" value="${(n.fecha || new Date().toISOString()).slice(0, 10)}"></div>
        </div>
        <div class="field"><label for="n-img">Imagen (ruta o URL)</label><input class="input" id="n-img" name="imagen" value="${esc(n.imagen || '')}"></div>
        <div class="field"><label for="n-entr">Entradilla *</label><textarea class="input" id="n-entr" name="entradilla" required>${esc(n.entradilla || '')}</textarea></div>
        <div class="field"><label for="n-cuerpo">Cuerpo</label><textarea class="input" id="n-cuerpo" name="parrafos" style="min-height:220px">${esc((n.parrafos || []).join('\n\n'))}</textarea><small>Un párrafo por línea</small></div>
        <div class="field"><label for="n-lista">Lista numerada (opcional)</label><textarea class="input" id="n-lista" name="lista">${esc((n.lista || []).join('\n'))}</textarea><small>Un elemento por línea</small></div>
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

/* ---------- Sugerencias ---------- */
const pintarRecomendaciones = () => {
    $('[data-tabla="recomendaciones"]').innerHTML = estado.recomendaciones.map((r) => `
        <tr>
            <td class="table__title">${esc(r.pelicula)}</td>
            <td>${esc(r.nombre)}<div class="table__sub">${esc(r.email)}</div></td>
            <td class="table__sub">${fechaLarga(r.createdAt)}</td>
            <td>
                <label class="sr-only" for="e-${r._id}">Estado</label>
                <select class="select estado" id="e-${r._id}" data-estado="${esc(r.estado)}" data-id="${r._id}">
                    ${['pendiente', 'añadida', 'descartada'].map((e) => `<option value="${e}" ${r.estado === e ? 'selected' : ''}>${e[0].toUpperCase() + e.slice(1)}</option>`).join('')}
                </select>
            </td>
            <td><div class="table__actions"><button class="btn btn--danger btn--sm" data-borrar="recomendaciones" data-id="${r._id}">Borrar</button></div></td>
        </tr>`).join('') || '<tr><td colspan="5" class="table__sub" style="text-align:center;padding:2rem">No hay sugerencias</td></tr>'
}

const cargarRecomendaciones = async () => {
    try {
        estado.recomendaciones = await api.recomendaciones.listar({ estado: $('[data-filtro-estado]').value })
        pintarRecomendaciones()
    } catch (error) {
        filaError($('[data-tabla="recomendaciones"]'), 5, error)
    }
    contar()
}

/* ---------- Drawer de creación / edición ---------- */
const drawer = $('[data-drawer]')
const drawerForm = $('[data-drawer-form]')
const guardar = $('[data-guardar]')

const abrirDrawer = async (tipo, id) => {
    edicion = { tipo, id }
    const nombre = tipo === 'peliculas' ? 'película' : 'noticia'
    $('#drawer-title').textContent = id ? `Editar ${nombre}` : `Nueva ${nombre}`

    let datos = {}
    if (id && tipo === 'peliculas') datos = estado.peliculas.find((p) => p._id === id)
    /* El listado de noticias no trae el cuerpo: pedimos la noticia completa */
    if (id && tipo === 'noticias') {
        try { datos = await api.noticias.obtener(id) } catch (error) { return toast(error.message, 'error') }
    }

    $('[data-drawer-body]').innerHTML = tipo === 'peliculas' ? formPelicula(datos) : formNoticia(datos)
    drawer.classList.add('is-open')
    drawer.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    drawerForm.querySelector('input')?.focus()
}

const cerrarDrawer = () => {
    drawer.classList.remove('is-open')
    drawer.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
    edicion = null
}

$$('[data-cerrar-drawer]').forEach((b) => b.addEventListener('click', cerrarDrawer))
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) cerrarDrawer() })

/* Habilita la URL de cada plataforma al marcarla */
drawerForm.addEventListener('change', (e) => {
    const k = e.target.dataset.pl
    if (k) {
        const url = drawerForm[`url-${k}`]
        url.disabled = !e.target.checked
        if (e.target.checked) url.focus()
    }
})

drawerForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const faltan = $$('[required]', drawerForm).filter((c) => !c.value.trim())
    $$('.field', drawerForm).forEach((f) => f.classList.remove('has-error'))
    if (faltan.length) {
        faltan.forEach((c) => c.closest('.field').classList.add('has-error'))
        faltan[0].focus()
        return toast('Rellena los campos obligatorios', 'error')
    }

    const { tipo, id } = edicion
    const recurso = api[tipo]
    const body = tipo === 'peliculas' ? leerPelicula(drawerForm) : leerNoticia(drawerForm)
    /* El PUT reemplaza el documento: conservamos el id de TMDB para no duplicar al reimportar */
    const tmdbId = tipo === 'peliculas' && id && estado.peliculas.find((p) => p._id === id)?.tmdbId
    if (tmdbId) body.tmdbId = tmdbId

    guardar.disabled = true
    try {
        /* Editar usa PUT (reemplazo completo), crear usa POST */
        if (id) await recurso.reemplazar(id, body)
        else await recurso.crear(body)
        toast(id ? 'Cambios guardados' : 'Creado correctamente')
        cerrarDrawer()
        tipo === 'peliculas' ? cargarPeliculas() : cargarNoticias()
    } catch (error) {
        toast(error.message, 'error')
    } finally {
        guardar.disabled = false
    }
})

/* ---------- Confirmación de borrado ---------- */
const confirmar = (texto) => new Promise((resolve) => {
    let respuesta = false
    abrirModal(`
        <div class="confirm">
            <h2>¿Seguro que quieres borrarlo?</h2>
            <p>${esc(texto)} Esta acción no se puede deshacer.</p>
            <div class="confirm__actions">
                <button class="btn btn--outline" data-no>Cancelar</button>
                <button class="btn btn--danger" data-si>Sí, borrar</button>
            </div>
        </div>`, { onClose: () => resolve(respuesta) })
    $('.modal [data-si]').addEventListener('click', () => { respuesta = true; cerrarModal() })
    $('.modal [data-no]').addEventListener('click', cerrarModal)
})
/* El modal es estrecho para la confirmación */
const estilo = document.createElement('style')
estilo.textContent = '.modal__box:has(.confirm){width:min(440px,100%)}'
document.head.append(estilo)

/* ---------- Importar desde TMDB ---------- */
const resultadoTmdb = (r) => `
    <li class="tmdb__item">
        ${r.poster ? `<img src="${esc(r.poster)}" alt="" loading="lazy">` : '<div class="tmdb__noimg">Sin póster</div>'}
        <div class="tmdb__info">
            <strong>${esc(r.titulo)}</strong>
            <span>${esc(r.anio ?? 's/f')}${r.tituloOriginal && r.tituloOriginal !== r.titulo ? ` · ${esc(r.tituloOriginal)}` : ''}</span>
        </div>
        ${r.enCatalogo
            ? '<span class="tag">En el catálogo</span>'
            : `<button class="btn btn--primary btn--sm" data-tmdb-importar="${r.tmdbId}">Añadir</button>`}
    </li>`

const abrirImportador = () => {
    abrirModal(`
        <div class="tmdb">
            <h2>Importar desde TMDB</h2>
            <p class="section__sub">Busca una película y añádela con su ficha, póster, tráiler y plataformas en España.</p>
            <form class="tmdb__form" data-tmdb-form>
                <label class="sr-only" for="tmdb-q">Título</label>
                <input class="input" id="tmdb-q" placeholder="Por ejemplo: Oppenheimer" autocomplete="off">
                <button class="btn btn--primary" type="submit">Buscar</button>
            </form>
            <ul class="tmdb__list" data-tmdb-resultados></ul>
        </div>`)
    const form = $('[data-tmdb-form]')
    const lista = $('[data-tmdb-resultados]')
    $('#tmdb-q').focus()

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const q = $('#tmdb-q').value.trim()
        if (q.length < 2) return toast('Escribe al menos 2 letras', 'error')
        lista.innerHTML = '<li class="section__sub">Buscando…</li>'
        try {
            const resultados = await api.tmdb.buscar(q)
            lista.innerHTML = resultados.length ? resultados.map(resultadoTmdb).join('') : '<li class="section__sub">Sin resultados en TMDB</li>'
        } catch (error) {
            lista.innerHTML = `<li class="alert alert--error">${ICON.alert}<span>${esc(error.message)}</span></li>`
        }
    })

    lista.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-tmdb-importar]')
        if (!btn) return
        btn.disabled = true
        btn.textContent = 'Añadiendo…'
        try {
            const peli = await api.tmdb.importar(btn.dataset.tmdbImportar)
            btn.outerHTML = '<span class="tag tag--accent">Añadida</span>'
            const donde = peli.plataformas.map((pl) => PLATAFORMAS[pl.clave]?.nombre).filter(Boolean).join(', ')
            toast(donde ? `${peli.titulo} añadida · ${donde}` : `${peli.titulo} añadida (sin plataforma en España)`)
            cargarPeliculas()
        } catch (error) {
            btn.disabled = false
            btn.textContent = 'Añadir'
            toast(error.message, 'error')
        }
    })
}

/* ---------- Delegación de eventos ---------- */
document.addEventListener('click', async (e) => {
    if (e.target.closest('[data-importar-tmdb]')) return abrirImportador()

    const nueva = e.target.closest('[data-nueva]')
    if (nueva) return abrirDrawer(nueva.dataset.nueva)

    const editar = e.target.closest('[data-editar]')
    if (editar) return abrirDrawer(editar.dataset.editar, editar.dataset.id)

    const destacar = e.target.closest('[data-destacar]')
    if (destacar) {
        const valor = destacar.getAttribute('aria-checked') !== 'true'
        destacar.setAttribute('aria-checked', valor)
        try {
            const actualizada = await api.peliculas.modificar(destacar.dataset.destacar, { destacada: valor })
            Object.assign(estado.peliculas.find((p) => p._id === actualizada._id), actualizada)
            toast(valor ? `${actualizada.titulo} aparece en la portada` : `${actualizada.titulo} ya no está destacada`)
        } catch (error) {
            destacar.setAttribute('aria-checked', !valor)
            toast(error.message, 'error')
        }
        return
    }

    const borrar = e.target.closest('[data-borrar]')
    if (borrar) {
        const { borrar: tipo, id } = borrar.dataset
        const item = estado[tipo].find((x) => x._id === id)
        const ok = await confirmar(`Vas a borrar “${item.titulo || item.pelicula}”.`)
        if (!ok) return
        try {
            await api[tipo].borrar(id)
            estado[tipo] = estado[tipo].filter((x) => x._id !== id)
            ;({ peliculas: pintarPeliculas, noticias: pintarNoticias, recomendaciones: pintarRecomendaciones })[tipo]()
            contar()
            toast('Borrado correctamente')
        } catch (error) {
            toast(error.message, 'error')
        }
    }
})

document.addEventListener('change', async (e) => {
    const sel = e.target.closest('select.estado')
    if (!sel) return
    try {
        await api.recomendaciones.modificar(sel.dataset.id, { estado: sel.value })
        sel.dataset.estado = sel.value
        toast('Estado actualizado')
    } catch (error) {
        toast(error.message, 'error')
    }
})

$('[data-filtro-peliculas]').addEventListener('input', pintarPeliculas)
$('[data-filtro-estado]').addEventListener('change', cargarRecomendaciones)

/* ---------- Acceso con clave de administrador ---------- */
const pedirClave = (mensaje = '') => {
    $('main').innerHTML = `
        <div class="page-head" style="max-width:440px;margin-inline:auto">
            <h1 class="page-head__title" style="font-size:2rem">Administración</h1>
            <p class="page-head__text">Introduce la clave de administrador para gestionar el catálogo.</p>
            <form class="form form-card" style="margin-top:1.4rem" data-login novalidate>
                <div class="field${mensaje ? ' has-error' : ''}">
                    <label for="clave-admin">Clave</label>
                    <input class="input" id="clave-admin" type="password" autocomplete="current-password" required>
                    <span class="field__error" aria-live="polite">${esc(mensaje)}</span>
                </div>
                <button class="btn btn--primary" type="submit">Entrar</button>
            </form>
        </div>`
    $('#clave-admin').focus()
    $('[data-login]').addEventListener('submit', async (e) => {
        e.preventDefault()
        const clave = $('#clave-admin').value.trim()
        if (!clave) return pedirClave('Escribe la clave')
        try {
            await api.admin.verificar(clave)
            claveAdmin.guardar(clave)
            location.reload()
        } catch (error) {
            pedirClave(error.status === 401 ? 'Clave incorrecta' : error.message)
        }
    })
}

const iniciar = async () => {
    try {
        await api.admin.verificar()
    } catch (error) {
        claveAdmin.borrar()
        return pedirClave(error.status === 401 ? '' : error.message)
    }
    cargarPeliculas()
    cargarNoticias()
    cargarRecomendaciones()
}

iniciar()
