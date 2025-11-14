// Variables globales
let carrito = [];
let productosFiltrados = [];

// Función para formatear precios en formato COP
function formatearPrecioCOP(precio) {
    return new Intl.NumberFormat('es-CO').format(precio);
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    cargarProductos();
    inicializarFiltros();
    inicializarCarrito();
    inicializarNavegacion();
    inicializarPagoModal();
});

// Cargar productos en la página
function cargarProductos() {
    const productosGrid = document.getElementById('productos-grid');
    productosGrid.innerHTML = '';
    
    productosFiltrados = productosFiltrados.length > 0 ? productosFiltrados : productos;
    
    productosFiltrados.forEach(producto => {
        const productoCard = document.createElement('div');
        productoCard.className = 'producto-card';
        productoCard.innerHTML = `
            <div class="producto-img">
                <img src="${producto.imagen}" alt="${producto.nombre}">
            </div>
            <div class="producto-info">
                <div class="producto-categoria">${producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1)}</div>
                <h3 class="producto-nombre">${producto.nombre}</h3>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <div class="producto-precio">$${formatearPrecioCOP(producto.precio)} COP</div>
                <button class="agregar-carrito" data-id="${producto.id}">Agregar al Carrito</button>
            </div>
        `;
        productosGrid.appendChild(productoCard);
    });
    
    // Agregar event listeners a los botones de agregar al carrito
    document.querySelectorAll('.agregar-carrito').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            agregarAlCarrito(id);
        });
    });
}

// Inicializar filtros de productos
function inicializarFiltros() {
    const filtroBtns = document.querySelectorAll('.filtro-btn');
    
    filtroBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filtroBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            const categoria = this.getAttribute('data-categoria');
            filtrarProductos(categoria);
        });
    });
}

// Filtrar productos por categoría
function filtrarProductos(categoria) {
    if (categoria === 'todos') {
        productosFiltrados = productos;
    } else {
        productosFiltrados = productos.filter(producto => producto.categoria === categoria);
    }
    
    cargarProductos();
}

// Inicializar funcionalidad del carrito
function inicializarCarrito() {
    const carritoBtn = document.getElementById('carrito-btn');
    const cerrarCarritoBtn = document.getElementById('cerrar-carrito');
    const carritoOverlay = document.getElementById('carrito-overlay');
    const carritoSidebar = document.getElementById('carrito-sidebar');
    
    // Abrir carrito
    carritoBtn.addEventListener('click', function() {
        carritoSidebar.classList.add('active');
        carritoOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Cerrar carrito
    cerrarCarritoBtn.addEventListener('click', cerrarCarrito);
    carritoOverlay.addEventListener('click', cerrarCarrito);
    
    // Finalizar compra
    document.getElementById('carrito-checkout').addEventListener('click', function() {
        if (carrito.length === 0) {
            alert('Tu carrito está vacío');
            return;
        }
        abrirModalPago();
    });
    
    // Cargar carrito desde localStorage si existe
    const carritoGuardado = localStorage.getItem('carritoVorgath');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
        actualizarCarrito();
    }
}

// Inicializar modal de pago
function inicializarPagoModal() {
    const pagoModal = document.getElementById('pago-modal');
    const cerrarPagoBtn = document.getElementById('cerrar-pago');
    const cancelarPagoBtn = document.getElementById('cancelar-pago');
    const confirmarPagoBtn = document.getElementById('confirmar-pago');
    const opcionesPago = document.querySelectorAll('input[name="metodo-pago"]');
    
    // Cerrar modal de pago
    cerrarPagoBtn.addEventListener('click', cerrarModalPago);
    cancelarPagoBtn.addEventListener('click', cerrarModalPago);
    
    // Cambiar formularios de pago
    opcionesPago.forEach(opcion => {
        opcion.addEventListener('change', function() {
            const metodo = this.value;
            cambiarFormularioPago(metodo);
        });
    });
    
    // Confirmar pago
    confirmarPagoBtn.addEventListener('click', procesarPago);
    
    // Cerrar modal al hacer clic fuera
    pagoModal.addEventListener('click', function(e) {
        if (e.target === pagoModal) {
            cerrarModalPago();
        }
    });
}

// Cambiar formulario de pago según método seleccionado
function cambiarFormularioPago(metodo) {
    // Ocultar todos los formularios
    document.getElementById('form-tarjeta').style.display = 'none';
    document.getElementById('info-paypal').style.display = 'none';
    document.getElementById('info-transferencia').style.display = 'none';
    
    // Mostrar el formulario correspondiente
    switch(metodo) {
        case 'tarjeta':
            document.getElementById('form-tarjeta').style.display = 'block';
            break;
        case 'paypal':
            document.getElementById('info-paypal').style.display = 'block';
            break;
        case 'transferencia':
            document.getElementById('info-transferencia').style.display = 'block';
            break;
    }
}

// Abrir modal de pago
function abrirModalPago() {
    const pagoModal = document.getElementById('pago-modal');
    const carritoOverlay = document.getElementById('carrito-overlay');
    
    // Actualizar resumen de compra
    actualizarResumenCompra();
    
    // Mostrar modal
    pagoModal.classList.add('active');
    carritoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Cerrar carrito
    cerrarCarrito();
}

// Cerrar modal de pago
function cerrarModalPago() {
    const pagoModal = document.getElementById('pago-modal');
    const carritoOverlay = document.getElementById('carrito-overlay');
    
    pagoModal.classList.remove('active');
    carritoOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Actualizar resumen de compra en el modal
function actualizarResumenCompra() {
    const resumenItems = document.getElementById('resumen-items');
    const resumenTotalPrecio = document.getElementById('resumen-total-precio');
    
    resumenItems.innerHTML = '';
    let total = 0;
    
    carrito.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;
        
        const resumenItem = document.createElement('div');
        resumenItem.className = 'resumen-item';
        resumenItem.innerHTML = `
            <span>${item.nombre} x${item.cantidad}</span>
            <span>$${formatearPrecioCOP(itemTotal)} COP</span>
        `;
        resumenItems.appendChild(resumenItem);
    });
    
    resumenTotalPrecio.textContent = `$${formatearPrecioCOP(total)} COP`;
}

// Procesar pago
function procesarPago() {
    const metodoPago = document.querySelector('input[name="metodo-pago"]:checked').value;
    let valido = true;
    
    // Validar formularios según el método de pago
    switch(metodoPago) {
        case 'tarjeta':
            valido = validarFormularioTarjeta();
            break;
        case 'paypal':
            valido = validarFormularioPayPal();
            break;
        case 'transferencia':
            valido = validarFormularioTransferencia();
            break;
    }
    
    if (valido) {
        const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        // Simular procesamiento de pago
        setTimeout(() => {
            alert(`¡Pago procesado exitosamente!\nTotal: $${formatearPrecioCOP(total)} COP\nMétodo: ${metodoPago}\nGracias por tu compra en Vorgath.`);
            
            // Limpiar carrito
            carrito = [];
            actualizarCarrito();
            localStorage.removeItem('carritoVorgath');
            
            // Cerrar modal
            cerrarModalPago();
        }, 1500);
    }
}

// Validar formulario de tarjeta
function validarFormularioTarjeta() {
    const numero = document.getElementById('numero-tarjeta').value;
    const fecha = document.getElementById('fecha-tarjeta').value;
    const cvv = document.getElementById('cvv-tarjeta').value;
    const nombre = document.getElementById('nombre-tarjeta').value;
    
    if (!numero || numero.length !== 16) {
        alert('Por favor ingresa un número de tarjeta válido (16 dígitos)');
        return false;
    }
    
    if (!fecha || !/^\d{2}\/\d{2}$/.test(fecha)) {
        alert('Por favor ingresa una fecha de vencimiento válida (MM/AA)');
        return false;
    }
    
    if (!cvv || cvv.length !== 3) {
        alert('Por favor ingresa un CVV válido (3 dígitos)');
        return false;
    }
    
    if (!nombre) {
        alert('Por favor ingresa el nombre que aparece en la tarjeta');
        return false;
    }
    
    return true;
}

// Validar formulario de PayPal
function validarFormularioPayPal() {
    const email = document.getElementById('email-paypal').value;
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        alert('Por favor ingresa un email de PayPal válido');
        return false;
    }
    
    return true;
}

// Validar formulario de transferencia
function validarFormularioTransferencia() {
    const comprobante = document.getElementById('comprobante-transferencia').value;
    
    if (!comprobante) {
        alert('Por favor ingresa el número de comprobante de transferencia');
        return false;
    }
    
    return true;
}

// Cerrar carrito
function cerrarCarrito() {
    document.getElementById('carrito-sidebar').classList.remove('active');
    document.getElementById('carrito-overlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Agregar producto al carrito
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    
    if (producto) {
        const itemExistente = carrito.find(item => item.id === id);
        
        if (itemExistente) {
            itemExistente.cantidad += 1;
        } else {
            carrito.push({
                ...producto,
                cantidad: 1
            });
        }
        
        actualizarCarrito();
        mostrarNotificacion(`${producto.nombre} agregado al carrito`);
    }
}

// Actualizar visualización del carrito
function actualizarCarrito() {
    const carritoItems = document.getElementById('carrito-items');
    const carritoContador = document.getElementById('carrito-contador');
    const carritoTotalPrecio = document.getElementById('carrito-total-precio');
    
    // Actualizar contador
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    carritoContador.textContent = totalItems;
    
    // Actualizar items del carrito
    if (carrito.length === 0) {
        carritoItems.innerHTML = '<div class="carrito-vacio">Tu carrito está vacío</div>';
        carritoTotalPrecio.textContent = '$0 COP';
    } else {
        carritoItems.innerHTML = '';
        let total = 0;
        
        carrito.forEach(item => {
            const itemTotal = item.precio * item.cantidad;
            total += itemTotal;
            
            const carritoItem = document.createElement('div');
            carritoItem.className = 'carrito-item';
            carritoItem.innerHTML = `
                <div class="carrito-item-img">
                    <img src="${item.imagen}" alt="${item.nombre}">
                </div>
                <div class="carrito-item-info">
                    <div class="carrito-item-nombre">${item.nombre}</div>
                    <div class="carrito-item-precio">$${formatearPrecioCOP(item.precio)} COP</div>
                    <div class="carrito-item-cantidad">
                        <button class="cantidad-btn disminuir" data-id="${item.id}">-</button>
                        <input type="text" class="cantidad-input" value="${item.cantidad}" readonly>
                        <button class="cantidad-btn aumentar" data-id="${item.id}">+</button>
                        <button class="eliminar-item" data-id="${item.id}">Eliminar</button>
                    </div>
                </div>
            `;
            carritoItems.appendChild(carritoItem);
        });
        
        carritoTotalPrecio.textContent = `$${formatearPrecioCOP(total)} COP`;
        
        // Agregar event listeners a los botones de cantidad y eliminar
        document.querySelectorAll('.disminuir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                modificarCantidad(id, -1);
            });
        });
        
        document.querySelectorAll('.aumentar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                modificarCantidad(id, 1);
            });
        });
        
        document.querySelectorAll('.eliminar-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                eliminarDelCarrito(id);
            });
        });
    }
    
    // Guardar carrito en localStorage
    localStorage.setItem('carritoVorgath', JSON.stringify(carrito));
}

// Modificar cantidad de un producto en el carrito
function modificarCantidad(id, cambio) {
    const item = carrito.find(item => item.id === id);
    
    if (item) {
        item.cantidad += cambio;
        
        if (item.cantidad <= 0) {
            eliminarDelCarrito(id);
        } else {
            actualizarCarrito();
        }
    }
}

// Eliminar producto del carrito
function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarCarrito();
    mostrarNotificacion('Producto eliminado del carrito');
}

// Mostrar notificación
function mostrarNotificacion(mensaje) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--color-oro);
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2000;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notificacion);
    
    // Mostrar notificación
    setTimeout(() => {
        notificacion.style.transform = 'translateY(0)';
        notificacion.style.opacity = '1';
    }, 100);
    
    // Ocultar y eliminar notificación después de 3 segundos
    setTimeout(() => {
        notificacion.style.transform = 'translateY(100px)';
        notificacion.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}

// Inicializar navegación suave
function inicializarNavegacion() {
    // Navegación suave para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Cambiar estilo del header al hacer scroll
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 100) {
            header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.05)';
        }
    });
}