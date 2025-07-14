// =============== MENÚ HAMBURGUESA CORREGIDO ===============
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMain = document.querySelector('.nav-main');
    const navOverlay = document.querySelector('.nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const body = document.body;

    // Función para abrir/cerrar menú
    function toggleMenu() {
        const isMenuOpen = navMain.classList.contains('nav-open');
        
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // Función para abrir menú
    function openMenu() {
        navMain.classList.add('nav-open');
        navOverlay.classList.add('overlay-active');
        menuToggle.classList.add('menu-active');
        body.style.overflow = 'hidden';
        body.classList.add('mobile-menu-open');
        
        // Cambiar icono a X
        menuToggle.innerHTML = '✕';
        
        // Animar entrada de los enlaces
        navLinks.forEach((link, index) => {
            link.style.animation = `slideInLeft 0.3s ease-out ${index * 0.1}s forwards`;
            
            // REMOVER EL SETPROPERTY QUE CAUSABA CONFLICTOS
            // link.style.setProperty('color', '#dc3545', 'important');
        });
    }

    // Función para cerrar menú
    function closeMenu() {
        navMain.classList.remove('nav-open');
        navOverlay.classList.remove('overlay-active');
        menuToggle.classList.remove('menu-active');
        body.style.overflow = '';
        body.classList.remove('mobile-menu-open');
        
        // Cambiar icono a hamburguesa
        menuToggle.innerHTML = '☰';
        
        // Limpiar animaciones y estilos inline
        navLinks.forEach(link => {
            link.style.animation = '';
            // LIMPIAR CUALQUIER ESTILO INLINE QUE PUEDA INTERFERIR
            link.style.removeProperty('color');
        });
    }

    // Event listeners
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Cerrar menú al hacer click en overlay
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    // Cerrar menú al hacer click en enlaces
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 980) {
                closeMenu();
            }
        });
    });

    // Cerrar menú al redimensionar ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth > 980) {
            closeMenu();
        }
    });

    // Cerrar menú con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMain.classList.contains('nav-open')) {
            closeMenu();
        }
    });
});

// =============== RESTO DEL CÓDIGO ORIGINAL SIN CAMBIOS ===============
// =============== FUNCIONALIDAD DE BOOKING ===============
async function checkAvailability() {
    const checkinDate = document.getElementById('checkin-date').value;
    const checkoutDate = document.getElementById('checkout-date').value;
    const adults = document.getElementById('adults').value;
    const children = document.getElementById('children').value;
    const messageDiv = document.getElementById('availabilityMessage');

    if (!checkinDate || !checkoutDate) {
        showMessage('Por favor selecciona las fechas de llegada y salida.', 'error');
        return;
    }

    const today = new Date();
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);

    if (checkin < today) {
        showMessage('La fecha de llegada no puede ser anterior a hoy.', 'error');
        return;
    }

    if (checkout <= checkin) {
        showMessage('La fecha de salida debe ser posterior a la fecha de llegada.', 'error');
        return;
    }

    // ✅ CONSULTA AL BACKEND
    try {
        const response = await fetch('/api/disponibilidad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkin: checkinDate, checkout: checkoutDate })
        });

        const data = await response.json();

        if (!data.disponible) {
            showMessage('No hay disponibilidad para las fechas seleccionadas.', 'error');
            return;
        }

        // 🔁 Si hay disponibilidad, prepara mensaje de WhatsApp
        const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
        const totalGuests = parseInt(adults) + parseInt(children);

        const message = `¡Hola! Me interesa hacer una reservación en Natura Glamping con los siguientes detalles:

📅 *Fechas:*
• Llegada: ${formatDate(checkin)}
• Salida: ${formatDate(checkout)}
• Noches: ${nights}

👥 *Huéspedes:*
• Adultos: ${adults}
• Niños: ${children}
• Total: ${totalGuests} personas

¿Podrían confirmarme disponibilidad y tarifas?

¡Gracias!`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/522282406341?text=${encodedMessage}`;

        showMessage(data.mensaje + ' Serás redirigido a WhatsApp...', 'success');

        setTimeout(() => {
            window.open(whatsappURL, '_blank');
        }, 2000);

    } catch (error) {
        console.error('Error al consultar disponibilidad:', error);
        showMessage('Error al verificar disponibilidad. Intenta más tarde.', 'error');
    }
}

// Función para mostrar mensajes
function showMessage(message, type) {
    const messageDiv = document.getElementById('availabilityMessage');
    messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
    messageDiv.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Función para formatear fecha
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
}

// =============== ANIMACIONES DE SCROLL ===============
// Función para animar elementos cuando entran en viewport
function animateOnScroll() {
    const elements = document.querySelectorAll('.fade-in');
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animate');
        }
    });
}

// Ejecutar animaciones al cargar y hacer scroll
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// // =============== SMOOTH SCROLL PARA ENLACES INTERNOS ===============
// document.addEventListener('DOMContentLoaded', function() {
//     // Seleccionar todos los enlaces que apuntan a anclas internas
//     const internalLinks = document.querySelectorAll('a[href^="#"]');
    
//     internalLinks.forEach(link => {
//         link.addEventListener('click', function(e) {
//             const href = this.getAttribute('href');
            
//             // Solo aplicar smooth scroll si el enlace apunta a un elemento existente
//             if (href !== '#' && href.length > 1) {
//                 const targetElement = document.querySelector(href);
                
//                 if (targetElement) {
//                     e.preventDefault();
                    
//                     // Obtener altura del header para ajustar el scroll
//                     const headerHeight = document.querySelector('.header-container').offsetHeight;
//                     const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
//                     window.scrollTo({
//                         top: targetPosition,
//                         behavior: 'smooth'
//                     });
//                 }
//             }
//         });
//     });
// });

// =============== SMOOTH SCROLL ROBUSTO PARA ENLACES INTERNOS ===============
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');

        if (link) {
            const href = link.getAttribute('href');

            if (href !== '#' && href.length > 1) {
                const targetElement = document.querySelector(href);
                    console.log('Clic detectado en enlace interno:', href); // se agrega para atrapar el error

                if (targetElement) {
                    e.preventDefault();

                    // const header = document.querySelector('.header-container');
                    // const headerHeight = header ? header.offsetHeight : 0;

                    // const targetPosition =
                    //     targetElement.getBoundingClientRect().top +
                    //     window.pageYOffset -
                    //     headerHeight -
                    //     20;

                    // window.scrollTo({
                    //     top: targetPosition,
                    //     behavior: 'smooth'
                    // });
                    targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                }
            }
        }
    });
});

// =============== UTILIDADES ADICIONALES ===============
// Configurar fechas mínimas en los inputs de fecha
document.addEventListener('DOMContentLoaded', function() {
    const checkinInput = document.getElementById('checkin-date');
    const checkoutInput = document.getElementById('checkout-date');
    
    if (checkinInput && checkoutInput) {
        // Fecha mínima = hoy
        const today = new Date().toISOString().split('T')[0];
        checkinInput.min = today;
        
        // Cuando cambia fecha de llegada, actualizar mínimo de salida
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            checkinDate.setDate(checkinDate.getDate() + 1); // Mínimo 1 noche
            checkoutInput.min = checkinDate.toISOString().split('T')[0];
            
            // Si checkout es anterior a la nueva fecha mínima, limpiarla
            if (checkoutInput.value && checkoutInput.value <= this.value) {
                checkoutInput.value = '';
            }
        });
    }
});

// Optimización de rendimiento para scroll
let ticking = false;

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(animateOnScroll);
        ticking = true;
    }
}

window.addEventListener('scroll', () => {
    requestTick();
    ticking = false;
});