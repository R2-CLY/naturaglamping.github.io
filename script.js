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


    // Menú Hamburguesa - Versión simplificada
    document.addEventListener('DOMContentLoaded', function() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navUl = document.querySelector('nav ul');
        
        if(menuToggle && navUl) {
            menuToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                navUl.classList.toggle('show');
                
                // Elimina la clase 'open' que podría estar causando conflicto
                this.textContent = navUl.classList.contains('show') ? '✖' : '☰';
            });
            
            document.addEventListener('click', function(e) {
                if(!navUl.contains(e.target) ){
                    navUl.classList.remove('show');
                    menuToggle.textContent = '☰';
                }
            });
        }
    });
    // Ajustes A

 // modal mensaje alerta
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('welcomeModal');
        const closeBtn = document.querySelector('.close-modal');
        const acceptBtn = document.getElementById('acceptBtn');
        
        // Función para cerrar el modal
        function closeModal() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restaura el scroll
        }
        
        // Función para abrir el modal
        function openModal() {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Previene scroll
        }
        
        // Mostrar modal al cargar
        openModal();
        
        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        acceptBtn.addEventListener('click', closeModal);
        
        // Cerrar al hacer clic fuera del modal
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    });