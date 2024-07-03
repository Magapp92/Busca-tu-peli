

document.addEventListener('DOMContentLoaded', () => {
    const poster = document.querySelector('[data-element="poster"]')
    const title = document.querySelector('[data-element="title"]')
    const sinopsis = document.querySelector('[data-element="sinopsis"]')
    const plataformasDiv = document.querySelector('[data-element="plataformas"]')
    const trailer = document.querySelector('[data-element="trailer"]')

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
