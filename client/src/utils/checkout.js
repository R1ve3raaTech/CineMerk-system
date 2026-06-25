import Swal from 'sweetalert2';

export function requireLogin(navigate) {
    Swal.fire({
        title: 'Inicia Sesión',
        text: 'Debes entrar a tu cuenta para realizar compras.',
        icon: 'warning',
        confirmButtonColor: '#c1121f',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        confirmButtonText: 'Ir a Login'
    }).then((res) => {
        if (res.isConfirmed) navigate('/login');
    });
}

export async function finalizePurchase({ currentUser, cart, clearCart, navigate }) {
    if (!currentUser) {
        Swal.fire('Inicia Sesión', 'Debes entrar a tu cuenta para pagar.', 'warning');
        return;
    }
    if (!cart || cart.length === 0) return;

    const total = cart.reduce((sum, item) => {
        const n = parseInt((item.price || '0').replace(/[^\d]/g, ''));
        return sum + (isNaN(n) ? 0 : n);
    }, 0);

    try {
        const tarjetaRes = await fetch(`/api/users/${currentUser.id}/tarjeta`);
        let tarjetaMerk = null;
        if (tarjetaRes.ok) tarjetaMerk = await tarjetaRes.json();

        const key = `cards_${currentUser.id}`;
        const manualCards = JSON.parse(localStorage.getItem(key)) || [];

        if (!tarjetaMerk && manualCards.length === 0) {
            Swal.fire('Sin métodos de pago', 'No tienes tarjetas asociadas. Añade una en Formas de Pago.', 'error');
            return;
        }

        let inputOptions = {};
        if (tarjetaMerk) {
            inputOptions['tarjeta_merk'] = `TarjetaMerk (₡${tarjetaMerk.balance.toLocaleString()})`;
        }
        manualCards.forEach((c, i) => {
            inputOptions[`manual_${i}`] = `Visa terminada en ...${c.number.slice(-4)}`;
        });

        const paymentSelection = await Swal.fire({
            title: 'Selecciona Método de Pago',
            text: `Total a cobrar: ₡${total.toLocaleString()}`,
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

        if (selectedMethod === 'tarjeta_merk') {
            if (tarjetaMerk.balance < total) {
                Swal.fire({
                    title: 'Saldo Insuficiente',
                    html: `<p>Tu TarjetaMerk tiene <b>₡${tarjetaMerk.balance.toLocaleString()}</b></p>
                           <p>El total es <b>₡${total.toLocaleString()}</b></p>`,
                    icon: 'error',
                    confirmButtonColor: '#c1121f'
                });
                return;
            }

            const confirm = await Swal.fire({
                title: '💳 Confirmar Pago',
                html: `<p>Total: <b style="color:#003566;">₡${total.toLocaleString()}</b></p>
                       <p style="color:#666;font-size:0.9rem;">Se descontará de tu TarjetaMerk.<br>
                       Saldo resultante: <b>₡${(tarjetaMerk.balance - total).toLocaleString()}</b></p>`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#003566',
                confirmButtonText: 'Confirmar'
            });
            if (!confirm.isConfirmed) return;

            await fetch(`/api/users/${currentUser.id}/tarjeta`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: -total })
            });
            paymentMethodName = 'TarjetaMerk';

        } else {
            const cardIndex = parseInt(selectedMethod.split('_')[1]);
            const card = manualCards[cardIndex];
            paymentMethodName = `Visa *${card.number.slice(-4)}`;

            const confirm = await Swal.fire({
                title: '💳 Confirmar Pago Externo',
                html: `<p>Total: <b style="color:#003566;">₡${total.toLocaleString()}</b></p>
                       <p style="color:#666;font-size:0.9rem;">Se procesará con Visa terminada en ${card.number.slice(-4)}</p>`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#003566',
                confirmButtonText: 'Procesar'
            });
            if (!confirm.isConfirmed) return;

            Swal.fire({
                title: 'Procesando banco...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            await new Promise(r => setTimeout(r, 1500));

            const aprobado = Math.random() > 0.2;
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

        clearCart();

        Swal.fire({
            title: '¡Compra Exitosa! 🎉',
            html: `<p>Orden: <b>${order.orderId}</b></p>
                   <p style="color:#666;font-size:0.9rem;">Pagado con <b>${paymentMethodName}</b>.</p>`,
            icon: 'success',
            confirmButtonColor: '#003566',
            confirmButtonText: 'Ver mis compras'
        }).then(() => {
            navigate('/purchases');
        });

    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'No se pudo procesar la compra. Intenta de nuevo.', 'error');
    }
}
