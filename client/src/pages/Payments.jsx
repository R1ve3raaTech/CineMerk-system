import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Payments() {
    const { currentUser } = useAuth();
    const [tarjeta, setTarjeta] = useState(null);
    const [cards, setCards] = useState([]);

    const loadCards = useCallback(() => {
        if (!currentUser) return;
        const key = `cards_${currentUser.id}`;
        setCards(JSON.parse(localStorage.getItem(key)) || []);
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        loadCards();
        fetch(`/api/users/${currentUser.id}/tarjeta`)
            .then(r => (r.ok ? r.json() : null))
            .then(setTarjeta)
            .catch(() => console.warn('No se pudo cargar TarjetaMerk'));
    }, [currentUser, loadCards]);

    const openPaymentModal = (editIndex = null) => {
        let title = 'Añadir Nueva Tarjeta';
        let existingCard = null;

        if (editIndex !== null && currentUser) {
            const key = `cards_${currentUser.id}`;
            const allCards = JSON.parse(localStorage.getItem(key)) || [];
            existingCard = allCards[editIndex];
            if (existingCard) title = 'Editar Tarjeta';
        }

        Swal.fire({
            title,
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
                    const match = existingCard.number.match(/.{1,4}/g);
                    numInput.value = match ? match.join(' ') : existingCard.number;
                    expInput.value = existingCard.expiry || '';
                    cvvInput.value = existingCard.cvv || '';
                }

                numInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    let formatted = '';
                    for (let i = 0; i < value.length && i < 16; i++) {
                        if (i > 0 && i % 4 === 0) formatted += ' ';
                        formatted += value[i];
                    }
                    e.target.value = formatted;
                });

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
                let allCards = JSON.parse(localStorage.getItem(key)) || [];

                if (editIndex !== null) {
                    allCards[editIndex] = res.value;
                } else {
                    allCards.push(res.value);
                }

                localStorage.setItem(key, JSON.stringify(allCards));

                Swal.fire({
                    icon: 'success',
                    title: editIndex !== null ? '¡Tarjeta Actualizada!' : '¡Tarjeta Guardada!',
                    showConfirmButton: false,
                    timer: 1500
                });
                loadCards();
            }
        });
    };

    const deleteCard = (index) => {
        Swal.fire({
            title: '¿Eliminar tarjeta?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c1121f',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const key = `cards_${currentUser.id}`;
                let allCards = JSON.parse(localStorage.getItem(key)) || [];
                allCards.splice(index, 1);
                localStorage.setItem(key, JSON.stringify(allCards));
                loadCards();
                Swal.fire({ title: '¡Eliminada!', icon: 'success', timer: 1000, showConfirmButton: false });
            }
        });
    };

    return (
        <Layout title="Formas de Pago" showCart={false}>
            <section className="content-section active">
                <div className="section-header">
                    <h2>Mis Tarjetas Guardadas</h2>
                    <button className="btn btn-primary" style={{ display: currentUser ? '' : 'none' }} onClick={() => openPaymentModal()}>
                        <i className="fas fa-plus"></i> Añadir Tarjeta
                    </button>
                </div>
                <div id="payment-methods-list" className="stats-grid">
                    {!currentUser && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'white', borderRadius: 16, border: '1px dashed var(--border-color)' }}>
                            <i className="fas fa-credit-card" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem' }}></i>
                            <h3>Inicia sesión para ver tus tarjetas</h3>
                            <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Iniciar Sesión</Link>
                        </div>
                    )}

                    {currentUser && tarjeta && (
                        <div style={{
                            gridColumn: 'span 2',
                            background: 'linear-gradient(135deg, #003566 0%, #001d3d 60%, #004aad 100%)',
                            borderRadius: 20, padding: 28, color: 'white', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,53,102,0.35)'
                        }}>
                            <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                            <div style={{ position: 'absolute', bottom: -40, right: 40, width: 120, height: 120, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                                <div>
                                    <p style={{ fontSize: '0.65rem', letterSpacing: 3, opacity: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>Tarjeta Digital</p>
                                    <h2 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: 2, margin: 0 }}>TarjetaMerk</h2>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
                                    <i className="fas fa-gem" style={{ fontSize: '1.5rem', color: '#ffd700' }}></i>
                                </div>
                            </div>

                            <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: 4, opacity: 0.85, marginBottom: 20 }}>{tarjeta.number}</p>

                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.7, marginBottom: 6 }}>
                                    <span>Saldo disponible</span>
                                    <span>{Math.min(100, Math.round((tarjeta.balance / 50000) * 100))}%</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 100, height: 6 }}>
                                    <div style={{
                                        background: 'linear-gradient(90deg,#ffd700,#fff)', height: 6, borderRadius: 100,
                                        width: `${Math.min(100, Math.round((tarjeta.balance / 50000) * 100))}%`, transition: 'width 0.5s'
                                    }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 2 }}>SALDO ACTUAL</p>
                                    <p style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>₡{tarjeta.balance.toLocaleString('es-CR')}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 2 }}>TITULAR</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{currentUser.firstName} {currentUser.lastName || ''}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentUser && cards.map((c, i) => {
                        const maskedNum = `**** **** **** ${c.number.slice(-4)}`;
                        return (
                            <div className="payment-card-custom" key={i} style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                    <div>
                                        <i className="fab fa-cc-visa" style={{ fontSize: '2.5rem', marginBottom: 5 }}></i>
                                        <p style={{ fontSize: '0.6rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Credit Card</p>
                                    </div>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/250px-Visa_Inc._logo.svg.png" style={{ height: 18, filter: 'brightness(0) invert(1)', opacity: 0.8 }} />
                                </div>
                                <p style={{ fontFamily: "'Courier New',monospace", fontSize: '1.5rem', letterSpacing: 2, margin: '10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{maskedNum}</p>
                                <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.9, marginBottom: 5 }}>
                                        <span style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>{c.holder || 'TITULAR'}</span>
                                        <span style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{c.expiry}</span>
                                    </div>
                                </div>
                                <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: 8 }}>
                                    <button onClick={() => openPaymentModal(i)} title="Editar" style={{ background: 'none', border: 'none', color: 'white', opacity: 0.4, cursor: 'pointer', fontSize: '1rem' }}>
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button onClick={() => deleteCard(i)} title="Eliminar" style={{ background: 'none', border: 'none', color: 'white', opacity: 0.4, cursor: 'pointer', fontSize: '1rem' }}>
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {currentUser && !tarjeta && cards.length === 0 && (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#aaa' }}>No tienes tarjetas guardadas.</p>
                    )}
                </div>
            </section>
        </Layout>
    );
}
