

document.addEventListener('DOMContentLoaded', () => {
    const poster = document.querySelector('[data-element="poster"]')
    const title = document.querySelector('[data-element="title"]')
    const sinopsis = document.querySelector('[data-element="sinopsis"]')
    const plataformasDiv = document.querySelector('[data-element="plataformas"]')
    const trailer = document.querySelector('[data-element="trailer"]')
    const tituloOriginal = document.querySelector('[data-element="titulo-original"]')
    const año = document.querySelector('[data-element="año"]')
    const duracion = document.querySelector('[data-element="duracion"]')
    const pais = document.querySelector('[data-element="pais"]')
    const direccion = document.querySelector('[data-element="direccion"]')
    const guion = document.querySelector('[data-element="guion"]')
    const reparto = document.querySelector('[data-element="reparto"]')
    const companias = document.querySelector('[data-element="companias"]')
    const genero = document.querySelector('[data-element="genero"]')


    const params = new URLSearchParams(window.location.search)
    const movieName = params.get('nombre')

    if (!movieName) {
        alert('Nombre de película no especificado')
        return
    }

    fetch('peliculas.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar las películas')
            }
            return response.json()
        })
        .then(data => {
            const movie = data.find(pelicula => pelicula.nombre === movieName)
            if (!movie) {
                alert('Película no encontrada')
                return;
            }
            updateMovieDetails(movie)
        })
        .catch(error => console.error('Error:', error))

    function updateMovieDetails(movie) {
        poster.src = movie.poster
        title.textContent = movie.nombre
        sinopsis.textContent = movie.sinopsis
        tituloOriginal.textContent = movie.titulo_original
        año.textContent = movie.año
        duracion.textContent = movie.duracion
        pais.textContent = movie.pais
        direccion.textContent = movie.direccion
        guion.textContent = movie.guion
        reparto.textContent = movie.reparto
        companias.textContent = movie.companias
        genero.textContent = movie.genero


        plataformasDiv.innerHTML = ''
        movie.plataformas.forEach(plataforma => {
            const link = document.createElement('a')
            link.href = plataforma.url
            link.target = "_blank"
            const img = document.createElement('img')
            img.src = plataforma.imagen
            link.appendChild(img)
            plataformasDiv.appendChild(link)
        })

        trailer.src = movie.trailer
    }
})
