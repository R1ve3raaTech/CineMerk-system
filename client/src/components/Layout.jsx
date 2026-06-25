import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { finalizePurchase } from '../utils/checkout';

export default function Layout({ title, children, showCart = true }) {
    const { currentUser, logout } = useAuth();
    const cartCtx = useCart();
    const navigate = useNavigate();
    const [cartOpen, setCartOpen] = useState(false);

    const cart = cartCtx ? cartCtx.cart : [];

    const toggleCart = () => setCartOpen(o => !o);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    let total = 0;
    cart.forEach(item => {
        const n = parseInt((item.price || '0').replace(/[^\d]/g, ''));
        total += isNaN(n) ? 0 : n;
    });

    const handleCheckout = async () => {
        if (!cartCtx) return;
        await finalizePurchase({ currentUser, cart, clearCart: cartCtx.clearCart, navigate });
        setCartOpen(false);
    };

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="logo">
                    <i className="fas fa-clapperboard"></i>
                    <span>Cine<span>Merk</span></span>
                </div>
                <nav className="nav-menu">
                    <Link to="/" className="nav-item"><i className="fas fa-film"></i> Cartelera</Link>
                    <Link to="/combos" className="nav-item"><i className="fas fa-hotdog"></i> Combos y Confitería</Link>
                    <Link to="/purchases" className="nav-item"><i className="fas fa-shopping-bag"></i> Mis Compras</Link>
                    <Link to="/payments" className="nav-item"><i className="fas fa-credit-card"></i> Formas de Pago</Link>
                    {currentUser?.role === 'admin' && (
                        <Link to="/admin" className="nav-item"><i className="fas fa-user-shield"></i> Panel Admin</Link>
                    )}
                </nav>
                <div className="sidebar-footer">
                    <p>© 2026 CineMerk</p>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <h1 id="page-title">{title}</h1>
                    <div className="user-profile" id="user-profile-header">
                        {showCart && (
                            <button className="cart-toggle" id="cart-btn" onClick={toggleCart}>
                                <i className="fas fa-shopping-cart"></i>
                                <span className="cart-badge" id="cart-count">{currentUser ? cart.length : 0}</span>
                            </button>
                        )}
                        {!currentUser ? (
                            <div id="auth-buttons">
                                <Link to="/login" className="btn btn-auth-login"><i className="fas fa-sign-in-alt"></i> Entrar</Link>
                                <Link to="/register" className="btn btn-auth-register"><i className="fas fa-user-plus"></i> Crear Cuenta</Link>
                            </div>
                        ) : (
                            <div id="user-info" className="profile-summary">
                                <img id="user-avatar" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.firstName)}`} alt="Usuario" />
                                <span id="user-name-display">Hola, {currentUser.firstName}</span>
                                <button className="btn-logout" id="logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i></button>
                            </div>
                        )}
                    </div>
                </header>

                {children}
            </main>

            {showCart && (
                <>
                    <div className={`cart-overlay ${cartOpen ? 'active' : ''}`} onClick={toggleCart}></div>
                    <div className={`cart-sidebar ${cartOpen ? 'active' : ''}`} id="cart-sidebar">
                        <div className="cart-header">
                            <h2>Mi Carrito</h2>
                            <button className="close-cart" id="close-cart" onClick={toggleCart}><i className="fas fa-times"></i></button>
                        </div>
                        <div className="cart-items" id="cart-items">
                            <CartItemsList />
                        </div>
                        <div className="cart-footer">
                            <div className="cart-total">
                                <span>Total:</span>
                                <span id="cart-total-amount">₡{total.toLocaleString()}</span>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }} id="checkout-btn" disabled={cart.length === 0} onClick={handleCheckout}>
                                Finalizar Compra
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function CartItemsList() {
    const { cart, removeFromCart, changeComboQty } = useCart();

    if (!cart || cart.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
                <i className="fas fa-shopping-cart" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }}></i>
                <p>Tu carrito está vacío</p>
            </div>
        );
    }

    return cart.map((item, index) => {
        const isTicket = item.type === 'entrada';
        const icon = isTicket ? 'fa-ticket-alt' : 'fa-hotdog';
        const color = isTicket ? '#c1121f' : '#f4a261';
        const qty = item.qty || 1;

        return (
            <div className="cart-item" key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fas ${icon}`} style={{ color, fontSize: '1.2rem' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.movieTitle || item.name}</h4>
                    {isTicket && (
                        <>
                            <p style={{ fontSize: '0.78rem', color: '#555', margin: '4px 0 0' }}>
                                <i className="fas fa-door-open" style={{ color, width: '14px' }}></i> {item.roomName} &nbsp;
                                <i className="fas fa-clock" style={{ color, width: '14px' }}></i> {item.time}
                            </p>
                            <p style={{ fontSize: '0.78rem', color: '#555', margin: '3px 0 0' }}>
                                <i className="fas fa-chair" style={{ color, width: '14px' }}></i>
                                {' '}Asientos: <strong>{item.seats ? item.seats.join(', ') : '—'}</strong>
                            </p>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color, margin: '5px 0 0' }}>{item.price}</p>
                        </>
                    )}
                    {!isTicket && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                            <button onClick={() => changeComboQty(index, -1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #ddd', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#555' }}>
                                <i className="fas fa-minus" style={{ fontSize: '0.6rem' }}></i>
                            </button>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 18, textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => changeComboQty(index, 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid #ddd', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#555' }}>
                                <i className="fas fa-plus" style={{ fontSize: '0.6rem' }}></i>
                            </button>
                            <span style={{ fontSize: '0.76rem', color: '#999', marginLeft: 4 }}>= {item.price}</span>
                        </div>
                    )}
                </div>
                <button onClick={() => removeFromCart(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4, flexShrink: 0 }}>
                    <i className="fas fa-times"></i>
                </button>
            </div>
        );
    });
}
