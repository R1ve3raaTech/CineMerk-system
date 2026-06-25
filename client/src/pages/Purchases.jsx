import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Purchases() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        fetch(`/api/orders/user/${currentUser.id}`)
            .then(r => r.json())
            .then(setOrders)
            .catch(console.error);
    }, [currentUser]);

    return (
        <Layout title="Mis Compras" showCart={false}>
            <section className="content-section active">
                <div id="purchases-grid" className="tickets-grid">
                    {!currentUser && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 16, border: '1px dashed var(--border-color)' }}>
                            <i className="fas fa-shopping-bag" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }}></i>
                            <h3>Inicia sesión para ver tus compras</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Para consultar tus compras debes acceder a tu cuenta.</p>
                            <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
                        </div>
                    )}
                    {currentUser && orders && orders.length === 0 && (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>No tienes compras realizadas aún.</p>
                    )}
                    {currentUser && orders && [...orders].reverse().map(order => (
                        <div className="ticket-card" key={order.id} style={ticketCardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 4 }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#003566' }}><i className="fas fa-shopping-bag"></i> Bolsa de Compra</h3>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>
                                    Orden: <span style={{ fontFamily: 'monospace', color: '#333' }}>{order.orderId}</span><br />
                                    {new Date(order.date).toLocaleDateString('es-CR')}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                {order.items.map((item, idx) => {
                                    const isTicket = item.type === 'entrada';
                                    return (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #eee' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {isTicket
                                                        ? <i className="fas fa-ticket-alt" style={{ color: '#c1121f' }}></i>
                                                        : <i className="fas fa-hotdog" style={{ color: '#f4a261' }}></i>}
                                                    <strong style={{ fontSize: '0.9rem' }}>{item.movieTitle || item.name}</strong>
                                                    {item.qty > 1 && <span style={{ fontSize: '0.75rem', background: '#eee', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>x{item.qty}</span>}
                                                </div>
                                                {isTicket && (
                                                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 4, paddingLeft: 24 }}>
                                                        {item.roomName} • {item.time} • Asientos: <b>{item.seats ? item.seats.join(', ') : '—'}</b>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f5f5f5', paddingTop: 14, marginTop: 12 }}>
                                <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 700 }}>Pagado con: <b>{order.paymentMethod}</b></span>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1, display: 'block' }}>Total Pagado</span>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#c1121f' }}>₡{order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </Layout>
    );
}

const ticketCardStyle = {
    background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column', gap: 12
};
