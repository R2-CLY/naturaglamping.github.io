//Creación de modulo
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
let slideInterval;

function showSlide(index) {
    // Oculta todas las slides
    slides.forEach(slide => {
        slide.classList.remove('active');
    });
    
    // Ajusta el índice si es inválido
    if (index >= slides.length) currentSlide = 0;
    if (index < 0) currentSlide = slides.length - 1;
    
    // Muestra la slide actual
    slides[currentSlide].classList.add('active');
}

function moveSlide(n) {
    currentSlide += n;
    showSlide(currentSlide);
    resetInterval(); // Reinicia el intervalo al hacer clic manual
}

function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => moveSlide(1), 4000); // Cambia cada 3 segundos
}

// Inicia el slider automático
document.addEventListener('DOMContentLoaded', () => {
    showSlide(currentSlide);
    slideInterval = setInterval(() => moveSlide(1), 3000);
});