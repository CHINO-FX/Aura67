// =============================================
// MENÚ MÓVIL
// =============================================
function toggleMenu() {
    const nav = document.getElementById('navLinks');
    nav.classList.toggle('active');
}

// Seleccionar servicio desde tarjeta
function selectService(serviceName) {
    document.getElementById('select-servicio').value = serviceName;
}

// Acordeón Canvas
function toggleAccordion(element) {
    const item = element.parentElement;
    item.classList.toggle('active-accordion');
}

// =============================================
// ANIMACIONES SCROLL
// =============================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// =============================================
// CONTADOR DE STATS
// =============================================
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const speed = 200;
                const updateCount = () => {
                    const count = +counter.innerText;
                    const inc = target / speed;
                    if (count < target) {
                        counter.innerText = Math.ceil(count + inc);
                        setTimeout(updateCount, 20);
                    } else {
                        if (target === 100) {
                            counter.innerText = target + '%';
                        } else {
                            counter.innerText = '+' + target;
                        }
                    }
                };
                updateCount();
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats-container');
if (statsSection) statsObserver.observe(statsSection);

// =============================================
// ENVÍO DE FORMULARIO + GENERACIÓN DE TICKET
// =============================================
async function enviar(e) {
    e.preventDefault();
    const form = document.getElementById('form');
    const btn = form.querySelector('.btn-submit');
    const originalText = btn.innerText;

    // Capturar datos del formulario ANTES de enviarlo
    const nombre = form.querySelector('input[name="nombre"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();

    btn.innerText = 'Enviando...';
    btn.disabled = true;

    try {
        const res = await fetch('https://formspree.io/f/xdayzzzd', {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
            // Generar y mostrar el ticket
            generarTicket(nombre, email);
            // Resetear el formulario y ocultar mensaje de éxito anterior
            form.reset();
            document.getElementById('exito').style.display = 'none';
            btn.innerText = originalText;
            btn.disabled = false;
        } else {
            btn.innerText = 'Error, intenta de nuevo';
            btn.disabled = false;
        }
    } catch (error) {
        btn.innerText = 'Error de conexión';
        btn.disabled = false;
    }
}

// =============================================
// LÓGICA DEL TICKET
// =============================================

/**
 * Genera y muestra el ticket modal con los datos del formulario y carrito.
 */
function generarTicket(nombre, email) {
    // Folio aleatorio
    const folio = 'AUR-' + String(Date.now()).slice(-6) + '-' + Math.floor(Math.random() * 90 + 10);

    // Fecha y hora actuales
    const ahora = new Date();
    const opciones = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    const fechaStr = ahora.toLocaleDateString('es-MX', opciones);

    // Calcular subtotal con los items del carrito
    let subtotal = 0;
    let cotizarCount = 0;
    cart.forEach(item => {
        if (item.price !== null) {
            subtotal += item.price * item.qty;
        } else {
            cotizarCount += item.qty;
        }
    });
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    // Rellenar datos en el ticket
    document.getElementById('tk-nombre').textContent = nombre || 'Sin especificar';
    document.getElementById('tk-email').textContent = email || 'Sin especificar';
    document.getElementById('tk-folio').textContent = folio;
    document.getElementById('tk-fecha').textContent = fechaStr;

    // Renderizar ítems
    const itemsContainer = document.getElementById('tk-items');
    if (cart.length > 0) {
        itemsContainer.innerHTML = cart.map(item => `
          <div class="ticket-item-row">
            <span class="ticket-item-name">${item.name}</span>
            <span class="ticket-item-qty">x${item.qty}</span>
            <span class="ticket-item-price">
              ${item.price !== null
                ? '$' + (item.price * item.qty).toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN'
                : 'A cotizar'}
            </span>
          </div>
        `).join('');
    } else {
        itemsContainer.innerHTML = `
          <div class="ticket-item-row">
            <span class="ticket-item-name" style="color:var(--text-muted); font-style:italic;">Sin servicios en carrito — consulta enviada</span>
          </div>
        `;
    }

    // Totales
    document.getElementById('tk-subtotal').textContent = '$' + subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN';
    document.getElementById('tk-iva').textContent = '$' + iva.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN';
    document.getElementById('tk-total').textContent = '$' + total.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN';

    // Servicios a cotizar
    const cotizarRow = document.getElementById('tk-cotizar-row');
    if (cotizarCount > 0) {
        cotizarRow.style.display = 'flex';
        document.getElementById('tk-cotizar-qty').textContent = cotizarCount + ' por cotizar';
    } else {
        cotizarRow.style.display = 'none';
    }

    // Limpiar el carrito
    cart = [];
    updateCartUI();

    // Mostrar el modal con animación
    const overlay = document.getElementById('ticketOverlay');
    overlay.style.display = 'flex';
    // Forzar reflow para que la transición funcione
    void overlay.offsetWidth;
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el ticket modal.
 */
function cerrarTicket() {
    const overlay = document.getElementById('ticketOverlay');
    overlay.classList.remove('visible');
    setTimeout(() => {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }, 400);
}

/**
 * Abre el diálogo de impresión del navegador.
 */
function imprimirTicket() {
    window.print();
}

/**
 * Descarga el ticket como PDF usando html2canvas + jsPDF si disponible,
 * o fallback a impresión en PDF del navegador.
 */
function descargarPDF() {
    // Intentar usar html2canvas + jsPDF (carga dinámica)
    const modal = document.getElementById('ticketModal');

    // Verificar si las librerías ya están cargadas
    if (typeof html2canvas !== 'undefined' && typeof jspdf !== 'undefined') {
        _generarPDFConLibrerias(modal);
        return;
    }

    // Cargar html2canvas dinámicamente
    const s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s1.onload = () => {
        const s2 = document.createElement('script');
        s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s2.onload = () => _generarPDFConLibrerias(modal);
        s2.onerror = () => _fallbackPDF();
        document.head.appendChild(s2);
    };
    s1.onerror = () => _fallbackPDF();
    document.head.appendChild(s1);
}

function _generarPDFConLibrerias(modal) {
    const btn = document.querySelector('.ticket-btn-pdf');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-circle-notch"></i> Generando...';
    btn.disabled = true;

    html2canvas(modal, {
        backgroundColor: '#0a0a0f',
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Ticket_AuraTEAM_' + document.getElementById('tk-folio').textContent + '.pdf');
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }).catch(() => {
        _fallbackPDF();
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    });
}

function _fallbackPDF() {
    showToast('Usa Ctrl+P → "Guardar como PDF" para descargar');
    setTimeout(() => window.print(), 800);
}

// Cerrar ticket al hacer clic fuera del modal
document.getElementById('ticketOverlay').addEventListener('click', function (e) {
    if (e.target === this) cerrarTicket();
});

// Cerrar con tecla Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('ticketOverlay');
        if (overlay.classList.contains('visible')) cerrarTicket();
    }
});

// =============================================
// LÓGICA DEL CARRITO DE COMPRAS
// =============================================

// Estado del carrito
let cart = [];
let toastTimeout = null;

/**
 * Agrega un servicio al carrito.
 * @param {string} name  - Nombre del servicio
 * @param {number|null} price - Precio en MXN (null = cotizar)
 * @param {string} icon  - Clase del ícono Phosphor (sin el prefijo "ph ")
 */
function addToCart(name, price, icon) {
    const existing = cart.find(item => item.name === name);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name, price, icon, qty: 1 });
    }

    updateCartUI();
    animateCartBtn();
    showToast('✓ "' + name + '" agregado al carrito');
}

/**
 * Cambia la cantidad de un ítem en el carrito.
 * @param {string} name - Nombre del servicio
 * @param {number} delta - +1 o -1
 */
function changeQty(name, delta) {
    const item = cart.find(i => i.name === name);
    if (!item) return;

    item.qty += delta;

    if (item.qty <= 0) {
        removeFromCart(name);
        return;
    }

    updateCartUI();
}

/**
 * Elimina un ítem del carrito por nombre.
 * @param {string} name
 */
function removeFromCart(name) {
    cart = cart.filter(i => i.name !== name);
    updateCartUI();
    showToast('Servicio eliminado del carrito');
}

/**
 * Vacía el carrito completamente.
 */
function clearCart() {
    cart = [];
    updateCartUI();
    showToast('Carrito vaciado');
}

/**
 * Redirige al formulario de cotización precargando los servicios del carrito.
 */
function checkout() {
    if (cart.length === 0) return;

    // Preselecciona el primer servicio con precio en el select
    const firstPriced = cart.find(i => i.price !== null);
    if (firstPriced) {
        selectService(firstPriced.name);
    } else {
        selectService(cart[0].name);
    }

    // Construye un resumen de los servicios seleccionados
    const serviciosList = cart.map(i =>
        i.price ? i.name + ' (x' + i.qty + ')' : i.name + ' x' + i.qty + ' — Cotizar'
    ).join(', ');

    // Rellena el textarea con los servicios del carrito si está vacío
    const textarea = document.querySelector('#form textarea[name="mensaje"]');
    if (textarea && !textarea.value.trim()) {
        textarea.value = 'Servicios de interés: ' + serviciosList + '.';
    }

    toggleCart();

    setTimeout(() => {
        document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
    }, 350);
}

/**
 * Abre o cierra el panel del carrito.
 */
function toggleCart() {
    const panel = document.getElementById('cartPanel');
    const overlay = document.getElementById('cartOverlay');
    const isOpen = panel.classList.contains('open');

    if (isOpen) {
        panel.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    } else {
        panel.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Actualiza toda la UI del carrito (ítems, contador, totales).
 */
function updateCartUI() {
    renderCartItems();
    updateCartCount();
    updateCartTotals();
}

/**
 * Renderiza los ítems dentro del panel.
 */
function renderCartItems() {
    const container = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');

    if (cart.length === 0) {
        container.innerHTML = `
          <div class="cart-empty">
            <i class="ph ph-shopping-cart-simple"></i>
            <p>Tu carrito está vacío.<br>Agrega servicios desde la sección de arriba.</p>
          </div>
        `;
        footer.style.display = 'none';
        return;
    }

    footer.style.display = 'block';

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-icon">
            <i class="ph ${item.icon}"></i>
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">
              ${item.price ? 'Desde $' + item.price.toLocaleString('es-MX') + ' MXN' : 'A cotizar'}
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="changeQty('${item.name}', -1)" aria-label="Reducir cantidad">
                <i class="ph ph-minus"></i>
              </button>
              <span class="qty-display">${item.qty}</span>
              <button class="qty-btn" onclick="changeQty('${item.name}', 1)" aria-label="Aumentar cantidad">
                <i class="ph ph-plus"></i>
              </button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.name}')" aria-label="Eliminar ${item.name}">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      `).join('');
}

/**
 * Actualiza el badge contador del botón del carrito en la nav.
 */
function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    const total = cart.reduce((sum, i) => sum + i.qty, 0);

    countEl.textContent = total;

    if (total > 0) {
        countEl.classList.add('visible');
    } else {
        countEl.classList.remove('visible');
    }
}

/**
 * Calcula y muestra el subtotal y servicios a cotizar.
 */
function updateCartTotals() {
    let subtotal = 0;
    let cotizarCount = 0;

    cart.forEach(item => {
        if (item.price !== null) {
            subtotal += item.price * item.qty;
        } else {
            cotizarCount += item.qty;
        }
    });

    document.getElementById('cartSubtotal').textContent =
        '$' + subtotal.toLocaleString('es-MX') + ' MXN';

    document.getElementById('cartCotizar').textContent = cotizarCount;

    document.getElementById('cartTotal').textContent =
        subtotal > 0
            ? '$' + subtotal.toLocaleString('es-MX') + ' MXN' + (cotizarCount > 0 ? ' + cotizaciones' : '')
            : cotizarCount > 0
                ? 'A cotizar'
                : '$0 MXN';
}

/**
 * Anima el botón del carrito cuando se agrega un ítem.
 */
function animateCartBtn() {
    const countEl = document.getElementById('cartCount');
    countEl.classList.remove('bounce');
    // Forzar reflow para reiniciar la animación
    void countEl.offsetWidth;
    countEl.classList.add('bounce');
}

/**
 * Muestra un toast de notificación temporal.
 * @param {string} msg
 */
function showToast(msg) {
    const toast = document.getElementById('cartToast');
    const msgEl = document.getElementById('cartToastMsg');

    msgEl.textContent = msg;
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

// Renderizar carrito vacío al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    renderCartItems();
});
