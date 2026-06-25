import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Layout from '../components/Layout';
import { useAddToCart } from '../utils/useAddToCart';

export default function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const navigate = useNavigate();
    const addToCart = useAddToCart();

    useEffect(() => {
        if (!id) { navigate('/'); return; }
        fetch('/api/combos')
            .then(res => res.json())
            .then(combos => {
                const found = combos.find(c => c.id === id);
                if (!found) {
                    Swal.fire('Error', 'Producto no encontrado', 'error').then(() => navigate('/'));
                    return;
                }
                setProduct(found);
                document.title = `CineMerk | ${found.name}`;
            })
            .catch(console.error);
    }, [id, navigate]);

    return (
        <Layout title="Detalle de Producto">
            <Link to="/combos" className="back-btn"><i className="fas fa-arrow-left"></i> Volver a Alimentos</Link>

            <div id="product-detail" className="content-section active">
                <div className="product-detail-container" style={productDetailContainerStyle}>
                    <div className="product-image-box" style={productImageBoxStyle}>
                        {product && <img src={product.image} alt={product.name} style={{ width: '100%', height: 'auto', borderRadius: 12, objectFit: 'contain' }} />}
                    </div>
                    <div className="product-info-box" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <span className="product-badge" style={productBadgeStyle}>{product ? product.type.toUpperCase() : 'ALIMENTO'}</span>
                        <h2 className="product-title" style={productTitleStyle}>{product ? product.name : 'Cargando producto...'}</h2>
                        <div className="product-price" style={productPriceStyle}>{product ? product.price : '₡0'}</div>
                        <p className="product-description" style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                            {product ? product.description : 'Cargando descripción detallada...'}
                        </p>

                        <div className="product-meta" style={productMetaStyle}>
                            <div className="meta-item">
                                <span className="meta-label">Tamaño</span>
                                <span className="meta-value">{product?.size || 'N/A'}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Estado</span>
                                <span className="meta-value">{product ? product.status.toUpperCase() : 'N/A'}</span>
                            </div>
                        </div>

                        {product && product.status === 'inactivo' ? (
                            <button className="btn btn-secondary" disabled style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}>
                                No Disponible
                            </button>
                        ) : (
                            <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}
                                onClick={() => product && addToCart({ name: product.name, price: product.price, image: product.image, type: 'food' })}>
                                <i className="fas fa-cart-plus"></i> Añadir al Carrito
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

const productDetailContainerStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start', marginTop: '2rem' };
const productImageBoxStyle = { background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-md)', padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const productBadgeStyle = { display: 'inline-block', padding: '0.5rem 1.2rem', background: '#fdf2f2', color: 'var(--primary)', borderRadius: 50, fontWeight: 700, fontSize: '0.9rem', width: 'fit-content' };
const productTitleStyle = { fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-dark)' };
const productPriceStyle = { fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' };
const productMetaStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '1.5rem 0', padding: '1.5rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' };
