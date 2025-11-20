// ============================================
// INICIALIZACIÓN
// ============================================

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    initYear();
    initMobileMenu();
    initScrollAnimations();
    initContactForm();
    initCounters();
    initScrollProgress();
});

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

// Actualizar año en el footer
function initYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// ============================================
// SCROLL PROGRESS INDICATOR
// ============================================

function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercentage = (scrollTop / documentHeight) * 100;
        
        progressBar.style.width = `${scrollPercentage}%`;
    });
}

// ============================================
// NAVEGACIÓN MÓVIL
// ============================================

function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navbarSticky = document.getElementById('navbar-sticky');
    
    if (!menuToggle || !navbarSticky) return;
    
    // Toggle del menú móvil
    menuToggle.addEventListener('click', () => {
        navbarSticky.classList.toggle('hidden');
    });

    // Cerrar menú móvil al hacer click en un enlace
    document.querySelectorAll('#navbar-sticky a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                navbarSticky.classList.add('hidden');
            }
        });
    });
}

// ============================================
// ANIMACIONES AL HACER SCROLL
// ============================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    // Observar todos los elementos con la clase 'reveal'
    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// FORMULARIO DE CONTACTO CON FIREBASE
// ============================================

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const notification = document.getElementById('notification');
    
    if (!contactForm || !notification) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(contactForm, notification);
    });
}

async function handleFormSubmit(form, notification) {
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    // Mostrar estado de carga
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...';
    btn.disabled = true;

    try {
        // Obtener datos del formulario
        const formData = {
            name: form.querySelector('#name').value,
            email: form.querySelector('#email').value,
            message: form.querySelector('#message').value,
            timestamp: new Date().toISOString(),
            read: false
        };

        // Guardar en Firebase Realtime Database
        const { database } = await import('./firebase-config.js');
        const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
        
        const messagesRef = ref(database, 'contact-messages');
        await push(messagesRef, formData);

        // Éxito
        showNotification(notification, 'success', '<i class="fas fa-check-circle mr-2"></i> ¡Mensaje enviado correctamente!');
        form.reset();
    } catch (error) {
        // Error
        console.error('Error al enviar:', error);
        showNotification(notification, 'error', '<i class="fas fa-exclamation-circle mr-2"></i> Error al enviar. Intenta de nuevo.');
    } finally {
        // Restaurar botón
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function showNotification(notification, type = 'success', message = '') {
    // Cambiar color según tipo
    notification.className = `fixed top-5 right-5 px-6 py-3 rounded shadow-lg transform transition-transform duration-300 z-50 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    
    if (message) {
        notification.innerHTML = message;
    }
    
    notification.classList.remove('translate-x-full');
    
    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full');
    }, 3000);
}

// ============================================
// UTILIDADES
// ============================================

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') {
            e.preventDefault();
            return;
        }
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// CONTADOR ANIMADO
// ============================================

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: "0px"
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => counterObserver.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Log de confirmación
console.log('✓ Portafolio cargado correctamente');
