// =============== MENÚ HAMBURGUESA CORREGIDO ===============
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMain = document.querySelector('.nav-main');
    const navOverlay = document.querySelector('.nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const body = document.body;

    function toggleMenu() {
        const isMenuOpen = navMain.classList.contains('nav-open');
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    function openMenu() {
        navMain.classList.add('nav-open');
        navOverlay.classList.add('overlay-active');
        menuToggle.classList.add('menu-active');
        body.style.overflow = 'hidden';
        body.classList.add('mobile-menu-open');
        menuToggle.innerHTML = '✕';
        navLinks.forEach((link, index) => {
            link.style.animation = `slideInLeft 0.3s ease-out ${index * 0.1}s forwards`;
        });
    }

    function closeMenu() {
        navMain.classList.remove('nav-open');
        navOverlay.classList.remove('overlay-active');
        menuToggle.classList.remove('menu-active');
        body.style.overflow = '';
        body.classList.remove('mobile-menu-open');
        menuToggle.innerHTML = '☰';
        navLinks.forEach(link => {
            link.style.animation = '';
            link.style.removeProperty('color');
        });
    }

    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (navOverlay) navOverlay.addEventListener('click', closeMenu);
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 980) closeMenu();
        });
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 980) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMain.classList.contains('nav-open')) {
            closeMenu();
        }
    });
});


// =============== UTILIDADES ADICIONALES ===============
document.addEventListener('DOMContentLoaded', function() {
    const checkinInput = document.getElementById('checkin-date');
    const checkoutInput = document.getElementById('checkout-date');
    if (checkinInput && checkoutInput) {
        const today = new Date().toISOString().split('T')[0];
        checkinInput.min = today;
        checkinInput.addEventListener('change', function() {
            const checkinDate = new Date(this.value);
            checkinDate.setDate(checkinDate.getDate() + 1);
            checkoutInput.min = checkinDate.toISOString().split('T')[0];
            if (checkoutInput.value && checkoutInput.value <= this.value) {
                checkoutInput.value = '';
            }
        });
    }
});

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


// =============== DISPONIBILIDAD - BOOKING ===============

// =============== UTILIDAD PARA FORMATEAR FECHAS ===============
function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}-${mes}-${anio}`;
}

// =============== VARIABLE GLOBAL PARA EL SERVICIO ===============
let servicioSeleccionado = '';

// Detectar selección desde botones de domos
document.querySelectorAll('.domo-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const servicio = this.getAttribute('data-servicio');
        if (servicio) {
            sessionStorage.setItem('servicioSeleccionado', servicio);
            servicioSeleccionado = servicio;

            // Scroll automático al booking-section
            const booking = document.getElementById('booking-section');
            if (booking) {
                booking.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// =============== DISPONIBILIDAD - BOOKING ===============
async function checkAvailability() {
    servicioSeleccionado = sessionStorage.getItem('servicioSeleccionado') || 'Solo hospedaje';

    const checkin = document.getElementById('checkin-date').value;
    const checkout = document.getElementById('checkout-date').value;

    const adults = parseInt(document.getElementById('adults').value, 10);
    const children = parseInt(document.getElementById('children').value, 10);

    // Validar límites
    if (adults > 4 || adults < 1 || children > 4 || children < 0) {
        showModal('<br>⚠️ El número máximo permitido es de 4 adultos y 4 niños.', '', false);
        return;
    }

    // Validar fechas
    if (!checkin || !checkout) {
        showModal('<br>⚠️ Por favor selecciona tu fecha de llegada y de salida.', '', false);
        return;
    }

    const checkinFormateado = formatearFecha(checkin);
    const checkoutFormateado = formatearFecha(checkout);

    // Detectar si estamos en localhost o en producción
    const isLocalhost = window.location.hostname === 'localhost';
    const API_URL = isLocalhost
    ? 'http://localhost:3000'
    : 'https://backend-ng-wfvh.onrender.com';

    try {
        const response = await fetch(`${API_URL}/api/disponibilidad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkin, checkout })
        });
        const result = await response.json();
        console.log('Respuesta del backend:', result);

        if (result.disponible) {
            // 📱 Generar link de WhatsApp con info completa
            const mensajeWhatsApp = `Hola, me gustaría reservar el servicio de: *${servicioSeleccionado}*, del ${checkinFormateado} al ${checkoutFormateado} para ${adults} adulto(s) y ${children} niño(s).`;
            const whatsappLink = `https://wa.me/522282406341?text=${encodeURIComponent(mensajeWhatsApp)}`;

            const btnWhatsAppLink = document.querySelector('#whatsappBtn');
            if (btnWhatsAppLink) {
                btnWhatsAppLink.href = whatsappLink;

                // Limpiar sesión al hacer clic
                btnWhatsAppLink.addEventListener('click', () => {
                    sessionStorage.removeItem('servicioSeleccionado');
                });
            }

            // ✅ SI HAY DISPONIBILIDAD
            showModal(
                '<br> ✅ <strong>¡Excelente, contamos con disponibilidad para tu reserva!</strong><br>',
                `
                <p class="date-ok">
                    📅 <strong>Tu fecha seleccionada:</strong><br>
                    del ${checkinFormateado} al ${checkoutFormateado}
                </p>
                <p>Servicio seleccionado: <strong>${servicioSeleccionado}</strong></p>
                <p>Si te parece, te ayudamos con el proceso de reserva.<br>
                Contáctanos vía WhatsApp.</p>
                `,
                true
            );
        } else {
            // ❌ SIN DISPONIBILIDAD
            const busyDatesList = result.dias_sin_espacio?.map(date => `<div>${formatearFecha(date)}</div>`).join('') || '<div>Ninguno</div>';

            const mensajeHTML = `
                ❌ <strong>${result.mensaje}</strong><br><br>
                <strong>Días sin espacio:</strong>
                <div>${busyDatesList}</div><br>
                <strong>El espacio que seleccionaste fue del:</strong><br>
                ${checkinFormateado} al ${checkoutFormateado}<br><br>
                Si requieres atención personalizada, por favor contáctanos vía WhatsApp.
            `;

            showModal(mensajeHTML, '', false);
        }
    } catch (error) {
        console.error('Error al consultar disponibilidad:', error);
        showModal('⚠️ Error al consultar la disponibilidad. Intenta más tarde.', '', false);
    }
}


function showModal(message, datesHTML, isAvailable) {
    const modal = document.getElementById('availabilityModal');
    const messageEl = document.getElementById('modalAvailabilityMessage');
    const datesEl = document.getElementById('availabilityDates');

    if (!messageEl || !datesEl || !modal) {
        console.error("No se encontraron elementos del modal");
        return;
    }

    // messageEl.textContent = message;
    messageEl.innerHTML = message;
    datesEl.innerHTML = datesHTML;

    modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('availabilityModal');
  modal.classList.add('hidden');
}

window.checkAvailability = checkAvailability;