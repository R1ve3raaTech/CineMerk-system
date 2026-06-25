import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAddToCart } from '../utils/useAddToCart';

export default function Home() {
    const [movies, setMovies] = useState([]);
    const [error, setError] = useState(false);
    const addToCart = useAddToCart();
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/movies')
            .then(res => res.json())
            .then(data => setMovies(data.filter(m => m.status === 'active')))
            .catch(e => { console.error(e); setError(true); });
    }, []);

    return (
        <Layout title="Cartelera">
            <section className="content-section active">
                <div id="movies-list" className="movies-grid">
                    {error && <p>Error cargando películas.</p>}
                    {!error && movies.map(m => (
                        <div className="movie-card" key={m.id}>
                            <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/movie/${m.id}`)}>
                                <img src={m.image} alt={m.title} className="movie-poster" />
                            </div>
                            <div className="movie-info">
                                <div className="movie-meta">
                                    <span className="badge">{m.classification}</span>
                                    <span className="badge">{m.genre}</span>
                                </div>
                                <h3 style={{ cursor: 'pointer' }} onClick={() => navigate(`/movie/${m.id}`)}>{m.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                    {m.duration && m.duration.includes('h') ? m.duration : `${m.duration} min`} | {m.times}
                                </p>
                                <button className="btn btn-primary btn-sm" onClick={() => addToCart({
                                    movieId: m.id,
                                    name: `Entrada: ${m.title}`,
                                    price: '₡4000',
                                    image: m.image,
                                    type: 'entrada'
                                })}>
                                    <i className="fas fa-ticket-alt"></i> Comprar Entrada
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </Layout>
    );
}
