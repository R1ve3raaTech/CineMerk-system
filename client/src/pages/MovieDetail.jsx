import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ROOM_PRICES = { '2D': 3000, '3D': 4500, 'IMAX': 6500, 'VIP': 8000 };

function getRoomPrice(room) {
    return ROOM_PRICES[room.type] || 3500;
}

function formatPrice(n) {
    return '₡' + n.toLocaleString('es-CR');
}

export default function MovieDetail() {
    const { id: movieId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const cartCtx = useCart();

    const [movie, setMovie] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [qty, setQty] = useState(1);

    const selectedSeatsRef = useRef([]);

    useEffect(() => {
        if (!currentUser) { navigate('/login'); return; }
        if (!movieId) { navigate('/'); return; }

        Promise.all([
            fetch('/api/movies').then(r => r.json()),
            fetch('/api/rooms').then(r => r.json())
        ]).then(([movies, allRooms]) => {
            const m = movies.find(x => x.id === movieId);
            if (!m) { navigate('/'); return; }
            setMovie(m);
            setRooms(allRooms.filter(r => r.status === 'operativa'));
        }).catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movieId]);

    if (!currentUser) return null;

    const times = movie ? movie.times.split(',').map(t => t.trim()) : [];
    const room = rooms.find(r => r.name === selectedRoom);
    const unitPrice = room ? getRoomPrice(room) : null;

    let priceDisplay = 'Elige sala';
    if (room && qty) {
        const total = unitPrice * qty;
        priceDisplay = qty > 1 ? `${formatPrice(unitPrice)} × ${qty} = ${formatPrice(total)}` : formatPrice(unitPrice);
    }

    const handleBuy = () => {
        if (!selectedTime) return Swal.fire({ title: 'Atención', text: 'Por favor selecciona un horario', icon: 'info', confirmButtonColor: '#c1121f' });
        if (!selectedRoom) return Swal.fire({ title: 'Atención', text: 'Por favor selecciona una sala', icon: 'info', confirmButtonColor: '#c1121f' });
        selectedSeatsRef.current = [];
        openSeatPicker(qty);
    };

    async function openSeatPicker(qtyVal) {
        let occupiedSeats = [];
        try {
            const occRes = await fetch(`/api/tickets/occupied/${movie.id}/${encodeURIComponent(selectedTime)}/${encodeURIComponent(selectedRoom)}`);
            if (occRes.ok) occupiedSeats = await occRes.json();
        } catch (err) { console.error('Error fetching occupied seats:', err); }

        const rows = ['A', 'B', 'C', 'D', 'E'];
        const cols = 10;
        const PRIMARY = '#c1121f';

        let seatHTML = `
            <div style="text-align:center; margin-bottom:12px;">
                <div style="background:linear-gradient(90deg,#555,#888,#555); height:6px; width:70%; margin:0 auto 6px; border-radius:4px;"></div>
                <span style="font-size:0.65rem; letter-spacing:3px; color:#999; text-transform:uppercase;">P A N T A L L A</span>
            </div>
            <div style="display:flex; justify-content:center; gap:6px; margin-bottom:16px; font-size:0.7rem; color:#666;">
                <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:14px;height:14px;background:#e0e0e0;border-radius:3px;display:inline-block;"></span>Libre</span>
                <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:14px;height:14px;background:${PRIMARY};border-radius:3px;display:inline-block;"></span>Seleccionado</span>
                <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:14px;height:14px;background:#bbb;border-radius:3px;display:inline-block;"></span>Ocupado</span>
            </div>
            <div id="seat-grid" style="display:grid; grid-template-columns: repeat(10, 34px); gap:6px; justify-content:center;">`;

        for (let r of rows) {
            for (let c = 1; c <= cols; c++) {
                const seatId = `${r}${c}`;
                const isOccupied = Array.isArray(occupiedSeats) && occupiedSeats.includes(seatId);
                seatHTML += `<div
                    class="seat-btn"
                    data-id="${seatId}"
                    data-occupied="${isOccupied}"
                    title="Asiento ${seatId}"
                    style="width:34px;height:34px;border-radius:6px;background:${isOccupied ? '#bbb' : '#e0e0e0'};
                    cursor:${isOccupied ? 'not-allowed' : 'pointer'};display:flex;
                    align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;
                    color:${isOccupied ? '#888' : '#444'};transition:background 0.15s;
                    border:2px solid ${isOccupied ? '#aaa' : 'transparent'};"
                >${seatId}</div>`;
            }
        }
        seatHTML += '</div><div id="sel-info" style="margin-top:14px;font-weight:700;color:' + PRIMARY + ';text-align:center;">Seleccionados: 0/' + qtyVal + '</div>';

        Swal.fire({
            title: `🎬 Elige tus ${qtyVal} asiento${qtyVal > 1 ? 's' : ''}`,
            html: seatHTML,
            width: 620,
            confirmButtonText: '✔ Confirmar Reserva',
            confirmButtonColor: '#c1121f',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            didOpen: () => {
                const btns = document.querySelectorAll('.seat-btn');
                btns.forEach(s => {
                    if (s.dataset.occupied === 'true') return;
                    s.addEventListener('click', () => {
                        const id = s.dataset.id;
                        let selectedSeats = selectedSeatsRef.current;
                        if (selectedSeats.includes(id)) {
                            selectedSeats = selectedSeats.filter(x => x !== id);
                            s.style.background = '#e0e0e0';
                            s.style.color = '#444';
                            s.style.border = '2px solid transparent';
                        } else if (selectedSeats.length < qtyVal) {
                            selectedSeats = [...selectedSeats, id];
                            s.style.background = PRIMARY;
                            s.style.color = 'white';
                            s.style.border = '2px solid #900';
                        }
                        selectedSeatsRef.current = selectedSeats;
                        document.getElementById('sel-info').textContent = `Seleccionados: ${selectedSeats.length}/${qtyVal}`;
                    });
                });
            },
            preConfirm: () => {
                if (selectedSeatsRef.current.length !== qtyVal) {
                    Swal.showValidationMessage(`Elige exactamente ${qtyVal} asiento${qtyVal > 1 ? 's' : ''}`);
                    return false;
                }
                return selectedSeatsRef.current;
            }
        }).then(res => {
            if (res.isConfirmed) {
                const selectedSeats = res.value;
                const totalPrice = unitPrice * qtyVal;
                const ticketItem = {
                    id: Date.now().toString(),
                    movieId: movie.id,
                    movieTitle: movie.title,
                    roomName: selectedRoom,
                    price: formatPrice(totalPrice),
                    seats: [...selectedSeats],
                    time: selectedTime,
                    qty: qtyVal,
                    image: movie.image,
                    type: 'entrada',
                    expiresAt: Date.now() + (10 * 60 * 1000)
                };
                cartCtx.addToCart(ticketItem);
                Swal.fire({
                    icon: 'success',
                    title: '¡Reservado!',
                    html: `<p>Asientos: <b>${selectedSeats.join(', ')}</b></p>
                           <p style="margin-top:8px;">Tienes <b>10 min</b> para finalizar la compra.</p>`,
                    timer: 5000,
                    showConfirmButton: false
                });
            }
        });
    }

    return (
        <Layout title="Detalle de Película">
            <Link to="/" className="back-btn"><i className="fas fa-arrow-left"></i> Volver a Cartelera</Link>

            <div id="movie-detail" className="content-section active">
                <div className="movie-detail-container">
                    <div className="movie-poster-box">
                        <img id="m-image" src={movie?.image || ''} alt={movie ? movie.title : 'Cargando...'} />
                    </div>
                    <div className="movie-info-box">
                        <div className="movie-badge-group">
                            <span className="movie-badge">{movie?.classification || 'TE'}</span>
                            <span className="movie-badge">{movie?.genre || 'GÉNERO'}</span>
                        </div>
                        <h2 className="movie-title">{movie ? movie.title : 'Cargando película...'}</h2>

                        <div className="movie-meta">
                            <div className="meta-item">
                                <span className="meta-label">Duración</span>
                                <span className="meta-value">{movie?.duration || 'N/A'}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Fechas</span>
                                <span className="meta-value">{movie?.dates || 'N/A'}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-value" style={{ color: '#c1121f' }}>{priceDisplay}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <h3 style={{ marginBottom: '1rem' }}>Sinopsis</h3>
                            <p className="movie-synopsis">{movie?.synopsis || 'Cargando historia...'}</p>
                        </div>

                        <div className="purchase-controls">
                            <div>
                                <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-clock"></i> 1. Selecciona el Horario</h3>
                                <div className="times-grid">
                                    {times.map(t => (
                                        <div key={t} className={`time-chip ${selectedTime === t ? 'selected' : ''}`}
                                            onClick={() => setSelectedTime(t)}>
                                            <span className="chip-label">Función</span>
                                            {t}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-door-open"></i> 2. Selecciona la Sala</h3>
                                <div className="room-grid">
                                    {rooms.length === 0 && <p style={{ color: '#999' }}>No hay salas disponibles en este momento.</p>}
                                    {rooms.map(r => {
                                        const price = getRoomPrice(r);
                                        const priceColor = price >= 6500 ? '#d4af37' : price >= 4500 ? '#c1121f' : '#2d6a4f';
                                        return (
                                            <div key={r.id || r.name} className={`room-chip ${selectedRoom === r.name ? 'selected' : ''}`}
                                                onClick={() => setSelectedRoom(r.name)}>
                                                <strong>{r.name}</strong>
                                                <span>{r.type}</span>
                                                <span style={{ fontWeight: 800, color: priceColor, fontSize: '0.85rem', marginTop: 2 }}>{formatPrice(price)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 style={{ marginBottom: '1rem' }}><i className="fas fa-users"></i> 3. Cantidad de personas</h3>
                                <div className="qty-input-group">
                                    <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}><i className="fas fa-minus"></i></button>
                                    <span id="qty-display">{qty}</span>
                                    <button className="qty-btn" onClick={() => setQty(q => Math.min(10, q + 1))}><i className="fas fa-plus"></i></button>
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', padding: '1.5rem', fontSize: '1.3rem', borderRadius: 15 }}
                                onClick={handleBuy}>
                                <i className="fas fa-th"></i> Elegir Asientos y Reservar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
