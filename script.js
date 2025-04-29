//Creación de modulo --- SLIDER AUTOMÁTICO ---
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


// Creación de --- efecto MENÚ HAMBURGUESA ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navUl = document.querySelector('nav ul');

    menuToggle.addEventListener('click', () => {
        navUl.classList.toggle('show');
        menuToggle.classList.toggle('open');
    });

    // Mostrar modal al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('welcomeModal');
        const closeBtn = document.querySelector('.close-modal');
        const acceptBtn = document.getElementById('acceptBtn');
        
        // Mostrar modal
        modal.style.display = 'flex';
        
        // Cerrar modal al hacer clic en X o botón Aceptar
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        acceptBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Cerrar al hacer clic fuera del modal
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    document.querySelectorAll('.domo-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });