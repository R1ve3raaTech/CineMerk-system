document.addEventListener('DOMContentLoaded', () => {
    let currentUser = JSON.parse(localStorage.getItem('cinema_user')) || null;
    let cart = JSON.parse(localStorage.getItem('cinema_cart')) || [];

    // --- CARRITO LOGIC ---
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalAmount = document.getElementById('cart-total-amount');

    const toggleCart = () => {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        if (cartSidebar.classList.contains('active')) {
            if (typeof updateCart === 'function') updateCart();
        }
    };

    if (cartBtn) cartBtn.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    function updateCartBadge() {
        if (!currentUser) {
            if (cartCount) cartCount.textContent = '0';
            return;
        }
        const cartKey = `cart_${currentUser.id}`;
        const userCart = JSON.parse(localStorage.getItem(cartKey)) || [];
        if (cartCount) cartCount.textContent = userCart.length;
    }

    window.addToCart = (item) => {
        if (!currentUser) {
            Swal.fire({
                title: 'Inicia Sesión',
                text: 'Debes entrar a tu cuenta para realizar compras.',
                icon: 'warning',
                confirmButtonColor: '#c1121f',
                showCancelButton: true,
                cancelButtonText: 'Cerrar',
                confirmButtonText: 'Ir a Login'
            }).then((res) => {
                if (res.isConfirmed) window.location.href = 'login.html';
            });
            return;
        }

        // Si es una entrada y viene de la lista general, redirigir al detalle para elegir sala/asientos
        if (item.type === 'entrada' && !item.seats) {
            window.location.href = `movie-detail.html?id=${item.movieId}`;
            return;
        }

        // Persistencia correcta por usuario
        const cartKey = `cart_${currentUser.id}`;
        let userCart = JSON.parse(localStorage.getItem(cartKey)) || [];
        userCart.push(item);
        localStorage.setItem(cartKey, JSON.stringify(userCart));

        updateCartBadge();
        if (window.updateCart) window.updateCart();

        Swal.fire({
            title: '¡Añadido!',
            text: `${item.name || item.movieTitle} se agregó al carrito`,
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    };

    window.removeFromCart = (index) => {
        if (!currentUser) return;
        const cartKey = `cart_${currentUser.id}`;
        let userCart = JSON.parse(localStorage.getItem(cartKey)) || [];
        userCart.splice(index, 1);
        localStorage.setItem(cartKey, JSON.stringify(userCart));
        updateCartBadge();
        if (typeof updateCart === 'function') updateCart();
    };

    // Cambia cantidad de un combo en el carrito
    window.changeComboQty = (index, delta) => {
        if (!currentUser) return;
        const cartKey = `cart_${currentUser.id}`;
        let userCart = JSON.parse(localStorage.getItem(cartKey)) || [];
        const item = userCart[index];
        if (!item) return;

        // Calcular precio unitario (dividir por qty actual si existe)
        const currentQty = item.qty || 1;
        const totalPriceNum = parseInt(item.price.replace(/[^\d]/g, ''));
        const unitPrice = Math.round(totalPriceNum / currentQty);

        const newQty = Math.max(1, Math.min(20, currentQty + delta));
        userCart[index].qty = newQty;
        userCart[index].price = `₡${(unitPrice * newQty).toLocaleString('es-CR')}`;
        localStorage.setItem(cartKey, JSON.stringify(userCart));
        if (typeof updateCart === 'function') updateCart();
    };

    window.updateCart = () => {
        const container = document.getElementById('cart-items');
        const countBadge = document.getElementById('cart-count');
        const totalAmount = document.getElementById('cart-total-amount');

        if (!container || !currentUser) return;

        const cart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`)) || [];
        countBadge.textContent = cart.length;

        if (cart.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:2rem; color:#aaa;">
                    <i class="fas fa-shopping-cart" style="font-size:2.5rem; margin-bottom:1rem; display:block;"></i>
                    <p>Tu carrito está vacío</p>
                </div>`;
            if (totalAmount) totalAmount.textContent = '₡0';
            return;
        }

        let total = 0;
        container.innerHTML = cart.map((item, index) => {
            const priceNum = parseInt(item.price.replace(/[^\d]/g, ''));
            total += priceNum;

            const isTicket = item.type === 'entrada';
            const icon = isTicket ? 'fa-ticket-alt' : 'fa-hotdog';
            const color = isTicket ? '#c1121f' : '#f4a261';
            const qty = item.qty || 1;

            // Para entradas: mostrar sala, hora y asientos
            const detailLines = isTicket
                ? `<p style="font-size:0.78rem; color:#555; margin:4px 0 0;">
                       <i class="fas fa-door-open" style="color:${color}; width:14px;"></i> ${item.roomName} &nbsp;
                       <i class="fas fa-clock" style="color:${color}; width:14px;"></i> ${item.time}
                   </p>
                   <p style="font-size:0.78rem; color:#555; margin:3px 0 0;">
                       <i class="fas fa-chair" style="color:${color}; width:14px;"></i>
                       Asientos: <strong>${item.seats ? item.seats.join(', ') : '—'}</strong>
                   </p>`
                : '';

            // Para combos/food: controles de cantidad
            const qtyControls = !isTicket ? `
                <div style="display:flex; align-items:center; gap:6px; margin-top:6px;">
                    <button onclick="changeComboQty(${index}, -1)"
                        style="width:26px;height:26px;border-radius:50%;border:1.5px solid #ddd;background:white;cursor:pointer;
                               display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:#555;
                               transition:all 0.15s;" onmouseover="this.style.borderColor='${color}';this.style.color='${color}'"
                        onmouseout="this.style.borderColor='#ddd';this.style.color='#555'">
                        <i class="fas fa-minus" style="font-size:0.6rem;"></i>
                    </button>
                    <span style="font-weight:700; font-size:0.9rem; min-width:18px; text-align:center;">${qty}</span>
                    <button onclick="changeComboQty(${index}, 1)"
                        style="width:26px;height:26px;border-radius:50%;border:1.5px solid #ddd;background:white;cursor:pointer;
                               display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:#555;
                               transition:all 0.15s;" onmouseover="this.style.borderColor='${color}';this.style.color='${color}'"
                        onmouseout="this.style.borderColor='#ddd';this.style.color='#555'">
                        <i class="fas fa-plus" style="font-size:0.6rem;"></i>
                    </button>
                    <span style="font-size:0.76rem; color:#999; margin-left:4px;">= ${item.price}</span>
                </div>` : '';

            return `
                <div class="cart-item" style="display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid #f0f0f0;">
                    <div style="width:42px; height:42px; border-radius:10px; background:${color}20; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i class="fas ${icon}" style="color:${color}; font-size:1.2rem;"></i>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <h4 style="margin:0; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.movieTitle || item.name}</h4>
                        ${detailLines}
                        ${isTicket ? `<p style="font-size:0.85rem; font-weight:700; color:${color}; margin:5px 0 0;">${item.price}</p>` : ''}
                        ${qtyControls}
                    </div>
                    <button onclick="removeFromCart(${index})" style="background:none; border:none; cursor:pointer; color:#ccc; padding:4px; flex-shrink:0;"
                        onmouseover="this.style.color='#c1121f'" onmouseout="this.style.color='#ccc'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

        if (totalAmount) totalAmount.textContent = `₡${total.toLocaleString()}`;

        const payBtn = document.querySelector('.cart-footer .btn-primary');
        if (payBtn) {
            payBtn.onclick = () => finalizePurchase();
            payBtn.disabled = cart.length === 0;
        }
    };


    updateCartBadge();

    // Logout logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('cinema_user');
            window.location.href = 'index.html';
        });
    }

    // Interfaz de Usuario (Login/Logout)
    function updateAuthUI() {
        const auth = document.getElementById('auth-buttons');
        const info = document.getElementById('user-info');
        const adminBtn = document.getElementById('admin-panel-link');

        if (!auth || !info) return;

        if (currentUser) {
            auth.style.display = 'none';
            info.style.display = 'flex';
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay) nameDisplay.textContent = `Hola, ${currentUser.firstName}`;
            const avatar = document.getElementById('user-avatar');
            if (avatar) avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.firstName)}`;

            if (currentUser.role === 'admin' && adminBtn) adminBtn.style.display = 'flex';
        } else {
            auth.style.display = 'flex';
            info.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
        }
    }

    updateAuthUI();

    // --- FUNCIONES GLOBALES DE CARGA ---

    window.loadCombos = async () => {
        const container = document.getElementById('combos-list');
        if (!container) return;

        try {
            const res = await fetch('/api/combos');
            if (!res.ok) throw new Error('No se pudieron cargar los combos');
            const combos = await res.json();

            container.innerHTML = combos.map(combo => {
                const itemData = JSON.stringify({
                    name: combo.name,
                    price: combo.price,
                    image: combo.image,
                    type: 'food'
                }).replace(/"/g, '&quot;');

                return `
                <div class="movie-card" style="${combo.status === 'inactivo' ? 'opacity: 0.7; filter: grayscale(0.5);' : ''}">
                    <div style="position: relative; cursor: pointer;" onclick="window.location.href='product-detail.html?id=${combo.id}'">
                        <img src="${combo.image}" alt="${combo.name}" class="movie-poster" style="height: 200px; object-fit: cover;">
                        <span class="status-badge ${combo.status === 'activo' ? 'status-operativa' : 'status-clausurada'}" 
                              style="position: absolute; top: 10px; right: 10px; margin: 0;">
                            ${combo.status.toUpperCase()}
                        </span>
                    </div>
                    <div class="movie-info">
                        <h3 style="margin-bottom: 5px; cursor: pointer;" onclick="window.location.href='product-detail.html?id=${combo.id}'">${combo.name}</h3>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; line-height: 1.2;">${combo.description}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                            <div>
                                <span class="badge" style="background: var(--bg-body); color: var(--text-main); font-size: 0.75rem;">
                                    <i class="fas fa-expand"></i> ${combo.size}
                                </span>
                            </div>
                            <span style="font-weight: 800; font-size: 1.2rem; color: var(--primary);">${combo.price}</span>
                        </div>
                        ${combo.status === 'activo' ? `
                            <button class="btn btn-primary btn-sm" style="margin-top: 15px; width: 100%;" onclick="addToCart(${itemData})">
                                <i class="fas fa-cart-plus"></i> Agregar
                            </button>
                        ` : `
                            <button class="btn btn-secondary btn-sm" disabled style="margin-top: 15px; width: 100%; cursor: not-allowed;">
                                No Disponible
                            </button>
                        `}
                    </div>
                </div>
            `;
            }).join('');
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p>Los alimentos no están disponibles.</p>';
        }
    };

    window.finalizePurchase = async () => {
        if (!currentUser) {
            Swal.fire('Inicia Sesión', 'Debes entrar a tu cuenta para pagar.', 'warning');
            return;
        }

        const cart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`)) || [];
        if (cart.length === 0) return;

        // Calcular total
        const total = cart.reduce((sum, item) => {
            const n = parseInt((item.price || '0').replace(/[^\d]/g, ''));
            return sum + (isNaN(n) ? 0 : n);
        }, 0);

        try {
            // Obtener TarjetaMerk
            const tarjetaRes = await fetch(`/api/users/${currentUser.id}/tarjeta`);
            let tarjetaMerk = null;
            if (tarjetaRes.ok) tarjetaMerk = await tarjetaRes.json();

            // Obtener tarjetas manuales
            const key = `cards_${currentUser.id}`;
            const manualCards = JSON.parse(localStorage.getItem(key)) || [];

            // Si no hay ningún método
            if (!tarjetaMerk && manualCards.length === 0) {
                Swal.fire('Sin métodos de pago', 'No tienes tarjetas asociadas. Añade una en Formas de Pago.', 'error');
                return;
            }

            // Construir opciones de pago para el SweetAlert
            let inputOptions = {};
            if (tarjetaMerk) {
                inputOptions['tarjeta_merk'] = `TarjetaMerk (\u20a1${tarjetaMerk.balance.toLocaleString()})`;
            }
            manualCards.forEach((c, i) => {
                inputOptions[`manual_${i}`] = `Visa terminada en ...${c.number.slice(-4)}`;
            });

            // Pedir al usuario que seleccione el método de pago
            const paymentSelection = await Swal.fire({
                title: 'Selecciona Método de Pago',
                text: `Total a cobrar: \u20a1${total.toLocaleString()}`,
                input: 'radio',
                inputOptions: inputOptions,
                inputValidator: (value) => {
                    if (!value) return 'Debes seleccionar una forma de pago';
                },
                confirmButtonColor: '#003566',
                confirmButtonText: 'Continuar Pago',
                showCancelButton: true,
                cancelButtonText: 'Cancelar'
            });

            if (!paymentSelection.isConfirmed) return;
            const selectedMethod = paymentSelection.value;
            let paymentMethodName = '';

            // ─── PROCESO DE PAGO ───
            if (selectedMethod === 'tarjeta_merk') {
                if (tarjetaMerk.balance < total) {
                    Swal.fire({
                        title: 'Saldo Insuficiente',
                        html: `<p>Tu TarjetaMerk tiene <b>\u20a1${tarjetaMerk.balance.toLocaleString()}</b></p>
                               <p>El total es <b>\u20a1${total.toLocaleString()}</b></p>`,
                        icon: 'error',
                        confirmButtonColor: '#c1121f'
                    });
                    return;
                }

                // Confirmación visual
                const confirm = await Swal.fire({
                    title: '\uD83D\uDCB3 Confirmar Pago',
                    html: `<p>Total: <b style="color:#003566;">\u20a1${total.toLocaleString()}</b></p>
                           <p style="color:#666;font-size:0.9rem;">Se descontará de tu TarjetaMerk.<br>
                           Saldo resultante: <b>\u20a1${(tarjetaMerk.balance - total).toLocaleString()}</b></p>`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#003566',
                    confirmButtonText: 'Confirmar'
                });
                if (!confirm.isConfirmed) return;

                // Descontar saldo en backend
                await fetch(`/api/users/${currentUser.id}/tarjeta`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: -total })
                });
                paymentMethodName = 'TarjetaMerk';

            } else {
                // Tarjeta Manual
                const cardIndex = parseInt(selectedMethod.split('_')[1]);
                const card = manualCards[cardIndex];
                paymentMethodName = `Visa *${card.number.slice(-4)}`;

                // Confirmación Visual
                const confirm = await Swal.fire({
                    title: '\uD83D\uDCB3 Confirmar Pago Externo',
                    html: `<p>Total: <b style="color:#003566;">\u20a1${total.toLocaleString()}</b></p>
                           <p style="color:#666;font-size:0.9rem;">Se procesará con Visa terminada en ${card.number.slice(-4)}</p>`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#003566',
                    confirmButtonText: 'Procesar'
                });
                if (!confirm.isConfirmed) return;

                // SIMULACIÓN DE RECHAZO (Ej: Aleatorio o simulando fondos insuficientes según el monto)
                // Usaremos un Math.random simple para simular aprobación bancaria, 
                // o rechazo si el total es excesivamente alto para dar un ejemplo.
                Swal.fire({
                    title: 'Procesando banco...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                await new Promise(r => setTimeout(r, 1500)); // Simulando carga

                const aprobado = Math.random() > 0.2; // 80% provabilidad de éxito
                if (!aprobado) {
                    Swal.fire({
                        title: 'Pago Rechazado',
                        text: 'El banco rechazó la transacción por fondos insuficientes o actividad inusual en esta tarjeta.',
                        icon: 'error',
                        confirmButtonColor: '#c1121f'
                    });
                    return;
                }
            }

            // CREAR LA ORDEN DESPUÉS DEL PAGO EXITOSO
            const orderRes = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    username: currentUser.username,
                    items: cart,
                    total,
                    paymentMethod: paymentMethodName
                })
            });

            if (!orderRes.ok) throw new Error('Error al registrar la orden');
            const order = await orderRes.json();

            // LIMPIAR Y REDIRIGIR
            localStorage.removeItem(`cart_${currentUser.id}`);
            if (typeof updateCart === 'function') updateCart();

            const cartSidebar = document.getElementById('cart-sidebar');
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartSidebar) cartSidebar.classList.remove('active');
            if (cartOverlay) cartOverlay.classList.remove('active');

            Swal.fire({
                title: '\u00a1Compra Exitosa! \uD83C\uDF89',
                html: `<p>Orden: <b>${order.orderId}</b></p>
                       <p style="color:#666;font-size:0.9rem;">Pagado con <b>${paymentMethodName}</b>.</p>`,
                icon: 'success',
                confirmButtonColor: '#003566',
                confirmButtonText: 'Ver mis compras'
            }).then(() => {
                window.location.href = 'purchases.html';
            });

        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'No se pudo procesar la compra. Intenta de nuevo.', 'error');
        }
    };
    window.loadMovies = async () => {
        const container = document.getElementById('movies-list');
        if (!container) return;

        try {
            const res = await fetch('/api/movies');
            const movies = await res.json();

            container.innerHTML = movies.filter(m => m.status === 'active').map(m => {
                const itemData = JSON.stringify({
                    movieId: m.id,
                    name: `Entrada: ${m.title}`,
                    price: "₡4000",
                    image: m.image,
                    type: 'entrada'
                }).replace(/"/g, '&quot;');

                return `
                <div class="movie-card">
                    <div style="cursor: pointer;" onclick="window.location.href='movie-detail.html?id=${m.id}'">
                        <img src="${m.image}" alt="${m.title}" class="movie-poster">
                    </div>
                    <div class="movie-info">
                        <div class="movie-meta">
                            <span class="badge">${m.classification}</span>
                            <span class="badge">${m.genre}</span>
                        </div>
                        <h3 style="cursor: pointer;" onclick="window.location.href='movie-detail.html?id=${m.id}'">${m.title}</h3>
                        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">${m.duration.includes('h') ? m.duration : m.duration + ' min'} | ${m.times}</p>
                        <button class="btn btn-primary btn-sm" onclick="addToCart(${itemData})">
                            <i class="fas fa-ticket-alt"></i> Comprar Entrada
                        </button>
                    </div>
                </div>
            `;
            }).join('');
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p>Error cargando películas.</p>';
        }
    };

    // ─── COMPRAS AGRUPADAS (ÓRDENES) ────────────────────────────────
    window.loadPurchases = async () => {
        const grid = document.getElementById('purchases-grid');
        if (!grid) return;

        if (!currentUser) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border-radius: 16px; border: 1px dashed var(--border-color);">
                    <i class="fas fa-shopping-bag" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>Inicia sesión para ver tus compras</h3>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Para consultar tus compras debes acceder a tu cuenta.</p>
                    <a href="login.html" class="btn btn-primary">Iniciar Sesión</a>
                </div>
            `;
            return;
        }

        try {
            const res = await fetch(`/api/orders/user/${currentUser.id}`);
            const orders = await res.json();

            if (orders.length === 0) {
                grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:3rem;">No tienes compras realizadas aún.</p>';
                return;
            }

            grid.innerHTML = orders.map(order => {
                const dateHtml = `<div style="text-align:right; font-size:0.8rem; color:#888; font-weight:600;">
                                    Orden: <span style="font-family:monospace; color:#333;">${order.orderId}</span><br>
                                    ${new Date(order.date).toLocaleDateString('es-CR')}
                                  </div>`;

                let itemsHtml = order.items.map(item => {
                    const isTicket = item.type === 'entrada';
                    const icon = isTicket ? '<i class="fas fa-ticket-alt" style="color:#c1121f;"></i>' : '<i class="fas fa-hotdog" style="color:#f4a261;"></i>';
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-top:8px; padding-top:8px; border-top:1px dashed #eee;">
                            <div style="flex:1;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                    ${icon}
                                    <strong style="font-size:0.9rem;">${item.movieTitle || item.name}</strong>
                                    ${item.qty > 1 ? `<span style="font-size:0.75rem; background:#eee; padding:2px 6px; border-radius:10px; font-weight:700;">x${item.qty}</span>` : ''}
                                </div>
                                ${isTicket ? `
                                    <div style="font-size:0.75rem; color:#666; margin-top:4px; padding-left:24px;">
                                        ${item.roomName} • ${item.time} • Asientos: <b>${item.seats ? item.seats.join(', ') : '—'}</b>
                                    </div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');

                return `
                <div class="ticket-card" style="background:white; border-radius:16px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.05); border:1px solid #eaeaea; display:flex; flex-direction:column; gap:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0f0f0; padding-bottom:12px; margin-bottom:4px;">
                        <h3 style="margin:0; font-size:1.1rem; color:#003566;"><i class="fas fa-shopping-bag"></i> Bolsa de Compra</h3>
                        ${dateHtml}
                    </div>
                    <div style="flex:1;">
                        ${itemsHtml}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:2px solid #f5f5f5; padding-top:14px; margin-top:12px;">
                        <span style="font-size:0.85rem; color:#888; font-weight:700;">Pagado con: <b>${order.paymentMethod}</b></span>
                        <div style="text-align:right;">
                            <span style="font-size:0.75rem; color:#888; text-transform:uppercase; font-weight:800; letter-spacing:1px; display:block;">Total Pagado</span>
                            <span style="font-size:1.4rem; font-weight:900; color:#c1121f;">₡${order.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>`;
            }).reverse().join(''); // reverse para mostrar las más nuevas primero
        } catch (e) {
            console.error(e);
            grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Error al cargar tus compras.</p>';
        }
    };

    window.renderPaymentMethods = async () => {
        const container = document.getElementById('payment-methods-list');
        if (!container) return;

        if (!currentUser) {
            container.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:3rem;background:white;border-radius:16px;border:1px dashed var(--border-color);">
                    <i class="fas fa-credit-card" style="font-size:3rem;color:#ccc;margin-bottom:1rem;"></i>
                    <h3>Inicia sesión para ver tus tarjetas</h3>
                    <a href="login.html" class="btn btn-primary" style="margin-top:1rem;">Iniciar Sesión</a>
                </div>`;
            return;
        }

        // Datos de tarjeta manual (localStorage)
        const key = `cards_${currentUser.id}`;
        const cards = JSON.parse(localStorage.getItem(key)) || [];

        // TarjetaMerk desde el servidor
        let tarjeta = null;
        try {
            const r = await fetch(`/api/users/${currentUser.id}/tarjeta`);
            if (r.ok) tarjeta = await r.json();
        } catch (e) { console.warn('No se pudo cargar TarjetaMerk'); }

        let html = '';

        // === TARJETA MERK (siempre primera) ===
        if (tarjeta) {
            const bal = tarjeta.balance.toLocaleString('es-CR');
            const pct = Math.min(100, Math.round((tarjeta.balance / 50000) * 100));
            html += `
            <div style="grid-column: span 2; background: linear-gradient(135deg, #003566 0%, #001d3d 60%, #004aad 100%);
                border-radius:20px; padding:28px; color:white; position:relative; overflow:hidden; box-shadow:0 8px 32px rgba(0,53,102,0.35);">
                <!-- Decorative circles -->
                <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;background:rgba(255,255,255,0.05);border-radius:50%;"></div>
                <div style="position:absolute;bottom:-40px;right:40px;width:120px;height:120px;background:rgba(255,255,255,0.04);border-radius:50%;"></div>

                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
                    <div>
                        <p style="font-size:0.65rem;letter-spacing:3px;opacity:0.6;text-transform:uppercase;margin-bottom:4px;">Tarjeta Digital</p>
                        <h2 style="font-size:1.6rem;font-weight:900;letter-spacing:2px;margin:0;">TarjetaMerk</h2>
                    </div>
                    <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:10px 16px;text-align:center;">
                        <i class="fas fa-gem" style="font-size:1.5rem;color:#ffd700;"></i>
                    </div>
                </div>

                <p style="font-family:monospace;font-size:1.2rem;letter-spacing:4px;opacity:0.85;margin-bottom:20px;">${tarjeta.number}</p>

                <div style="margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;font-size:0.75rem;opacity:0.7;margin-bottom:6px;">
                        <span>Saldo disponible</span>
                        <span>${pct}%</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.15);border-radius:100px;height:6px;">
                        <div style="background:linear-gradient(90deg,#ffd700,#fff);height:6px;border-radius:100px;width:${pct}%;transition:width 0.5s;"></div>
                    </div>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:flex-end;">
                    <div>
                        <p style="font-size:0.7rem;opacity:0.6;margin-bottom:2px;">SALDO ACTUAL</p>
                        <p style="font-size:2rem;font-weight:900;margin:0;">₡${bal}</p>
                    </div>
                    <div style="text-align:right;">
                        <p style="font-size:0.7rem;opacity:0.6;margin-bottom:2px;">TITULAR</p>
                        <p style="font-size:0.9rem;font-weight:700;">${currentUser.firstName} ${currentUser.lastName || ''}</p>
                    </div>
                </div>
            </div>`;
        }

        // === TARJETAS MANUALES ===
        if (cards.length > 0) {
            html += cards.map((c, i) => {
                const maskedNum = `**** **** **** ${c.number.slice(-4)}`;
                return `
                <div class="payment-card-custom">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;">
                        <div>
                            <i class="fab fa-cc-visa" style="font-size:2.5rem;margin-bottom:5px;"></i>
                            <p style="font-size:0.6rem;opacity:0.7;text-transform:uppercase;letter-spacing:1px;">Credit Card</p>
                        </div>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/250px-Visa_Inc._logo.svg.png" style="height:18px;filter:brightness(0) invert(1);opacity:0.8;">
                    </div>
                    <p style="font-family:'Courier New',monospace;font-size:1.5rem;letter-spacing:2px;margin:10px 0;text-shadow:0 2px 4px rgba(0,0,0,0.3);">${maskedNum}</p>
                    <div style="width:100%;">
                        <div style="display:flex;justify-content:space-between;font-size:0.75rem;opacity:0.9;margin-bottom:5px;">
                            <span style="text-transform:uppercase;font-weight:700;letter-spacing:1px;">${c.holder || 'TITULAR'}</span>
                            <span style="font-family:monospace;letter-spacing:1px;">${c.expiry}</span>
                        </div>
                    </div>
                    <div style="position:absolute;top:15px;right:15px;display:flex;gap:8px;">
                        <button onclick="openPaymentModal(${i})" style="background:none;border:none;color:white;opacity:0.4;cursor:pointer;font-size:1rem;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteCard(${i})" style="background:none;border:none;color:white;opacity:0.4;cursor:pointer;font-size:1rem;" onmouseover="this.style.opacity=1;this.style.color='#ff4d4d'" onmouseout="this.style.opacity=0.4;this.style.color='white'" title="Eliminar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>`;
            }).join('');
        }

        if (!tarjeta && cards.length === 0) {
            html = '<p style="grid-column:1/-1;text-align:center;color:#aaa;">No tienes tarjetas guardadas.</p>';
        }

        container.innerHTML = html;

        // Botón de agregar tarjeta
        const addBtn = document.querySelector('.section-header .btn-primary');
        if (addBtn) addBtn.style.display = currentUser ? '' : 'none';
    };

    window.openPaymentModal = (editIndex = null) => {
        let title = 'Añadir Nueva Tarjeta';
        let confirmBtn = 'Guardar Tarjeta';
        let existingCard = null;

        if (editIndex !== null && currentUser) {
            const key = `cards_${currentUser.id}`;
            const cards = JSON.parse(localStorage.getItem(key)) || [];
            existingCard = cards[editIndex];
            if (existingCard) {
                title = 'Editar Tarjeta';
                confirmBtn = 'Actualizar Tarjeta';
            }
        }

        Swal.fire({
            title: title,
            html: `
                <div style="text-align: left; padding: 0 10px;">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display:block; font-size: 0.8rem; font-weight:700; color:#666; margin-bottom:5px;">Nombre del Titular</label>
                        <input id="sw-name" class="swal2-input" placeholder="Nombre como aparece en la tarjeta" style="margin:0; width:100%;">
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display:block; font-size: 0.8rem; font-weight:700; color:#666; margin-bottom:5px;">Ubicación / Ciudad</label>
                        <input id="sw-loc" class="swal2-input" placeholder="Ej: San José, Costa Rica" style="margin:0; width:100%;">
                    </div>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="display:block; font-size: 0.8rem; font-weight:700; color:#666; margin-bottom:5px;">Número de Tarjeta</label>
                        <input id="sw-num" class="swal2-input" placeholder="XXXX XXXX XXXX XXXX" maxlength="19" style="margin:0; width:100%;">
                    </div>
                    <div style="display:flex; gap:15px;">
                        <div style="flex:1;">
                            <label style="display:block; font-size: 0.8rem; font-weight:700; color:#666; margin-bottom:5px;">Vencimiento</label>
                            <input id="sw-exp" class="swal2-input" placeholder="MM/YY" maxlength="5" style="margin:0; width:100%;">
                        </div>
                        <div style="flex:1;">
                            <label style="display:block; font-size: 0.8rem; font-weight:700; color:#666; margin-bottom:5px;">CVV</label>
                            <input id="sw-cvv" class="swal2-input" placeholder="123" maxlength="3" style="margin:0; width:100%;">
                        </div>
                    </div>
                </div>
            `,
            confirmButtonText: 'Guardar Tarjeta',
            confirmButtonColor: '#c1121f',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            didOpen: () => {
                const nameInput = document.getElementById('sw-name');
                const locInput = document.getElementById('sw-loc');
                const numInput = document.getElementById('sw-num');
                const expInput = document.getElementById('sw-exp');
                const cvvInput = document.getElementById('sw-cvv');

                if (existingCard) {
                    nameInput.value = existingCard.holder || '';
                    locInput.value = existingCard.location || '';

                    // Format existing number with spaces
                    let match = existingCard.number.match(/.{1,4}/g);
                    numInput.value = match ? match.join(' ') : existingCard.number;

                    expInput.value = existingCard.expiry || '';
                    cvvInput.value = existingCard.cvv || '';
                }

                // Formateador de número de tarjeta
                numInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    let formatted = '';
                    for (let i = 0; i < value.length && i < 16; i++) {
                        if (i > 0 && i % 4 === 0) formatted += ' ';
                        formatted += value[i];
                    }
                    e.target.value = formatted;
                });

                // Formateador de fecha MM/YY
                expInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                        e.target.value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    } else {
                        e.target.value = value;
                    }
                });
            },
            preConfirm: () => {
                const holder = document.getElementById('sw-name').value.trim();
                const location = document.getElementById('sw-loc').value.trim();
                const number = document.getElementById('sw-num').value.replace(/\s+/g, '');
                const expiry = document.getElementById('sw-exp').value.trim();
                const cvv = document.getElementById('sw-cvv').value.trim();

                if (!holder || !location || number.length < 16 || !expiry.includes('/') || cvv.length < 3) {
                    Swal.showValidationMessage('Por favor, verifique todos los campos');
                    return false;
                }
                return { holder, location, number, expiry, cvv };
            }
        }).then(res => {
            if (res.isConfirmed) {
                const key = `cards_${currentUser.id}`;
                let cards = JSON.parse(localStorage.getItem(key)) || [];

                if (editIndex !== null) {
                    cards[editIndex] = res.value; // Update
                } else {
                    cards.push(res.value); // Add
                }

                localStorage.setItem(key, JSON.stringify(cards));

                Swal.fire({
                    icon: 'success',
                    title: editIndex !== null ? '¡Tarjeta Actualizada!' : '¡Tarjeta Guardada!',
                    showConfirmButton: false,
                    timer: 1500
                });
                renderPaymentMethods();
            }
        });
    };

    window.deleteCard = (index) => {
        Swal.fire({
            title: '¿Eliminar tarjeta?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c1121f',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const key = `cards_${currentUser.id}`;
                let cards = JSON.parse(localStorage.getItem(key)) || [];
                cards.splice(index, 1);
                localStorage.setItem(key, JSON.stringify(cards));
                renderPaymentMethods();
                Swal.fire({
                    title: '¡Eliminada!',
                    icon: 'success',
                    timer: 1000,
                    showConfirmButton: false
                });
            }
        });
    };
});
