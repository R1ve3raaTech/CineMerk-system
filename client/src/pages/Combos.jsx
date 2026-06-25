import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAddToCart } from '../utils/useAddToCart';

export default function Combos() {
    const [combos, setCombos] = useState([]);
    const [error, setError] = useState(false);
    const addToCart = useAddToCart();
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/combos')
            .then(res => {
                if (!res.ok) throw new Error('No se pudieron cargar los combos');
                return res.json();
            })
            .then(setCombos)
            .catch(e => { console.error(e); setError(true); });
    }, []);

    return (
        <Layout title="Combos y Confitería">
            <section className="content-section active">
                <div className="section-header">
                    <h2>Combos y Alimentos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>¡Disfruta de nuestros snacks especiales!</p>
                </div>
                <div id="combos-list" className="movies-grid">
                    {error && <p>Los alimentos no están disponibles.</p>}
                    {!error && combos.map(combo => (
                        <div className="movie-card" key={combo.id} style={combo.status === 'inactivo' ? { opacity: 0.7, filter: 'grayscale(0.5)' } : {}}>
                            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/product/${combo.id}`)}>
                                <img src={combo.image} alt={combo.name} className="movie-poster" style={{ height: 200, objectFit: 'cover' }} />
                                <span className={`status-badge ${combo.status === 'activo' ? 'status-operativa' : 'status-clausurada'}`}
                                    style={{ position: 'absolute', top: 10, right: 10, margin: 0 }}>
                                    {combo.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="movie-info">
                                <h3 style={{ marginBottom: 5, cursor: 'pointer' }} onClick={() => navigate(`/product/${combo.id}`)}>{combo.name}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.2 }}>{combo.description}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span className="badge" style={{ background: 'var(--bg-body)', color: 'var(--text-main)', fontSize: '0.75rem' }}>
                                        <i className="fas fa-expand"></i> {combo.size}
                                    </span>
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{combo.price}</span>
                                </div>
                                {combo.status === 'activo' ? (
                                    <button className="btn btn-primary btn-sm" style={{ marginTop: 15, width: '100%' }}
                                        onClick={() => addToCart({ name: combo.name, price: combo.price, image: combo.image, type: 'food' })}>
                                        <i className="fas fa-cart-plus"></i> Agregar
                                    </button>
                                ) : (
                                    <button className="btn btn-secondary btn-sm" disabled style={{ marginTop: 15, width: '100%', cursor: 'not-allowed' }}>
                                        No Disponible
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </Layout>
    );
}
