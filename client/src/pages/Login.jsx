import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            Swal.fire({
                title: '¡Bienvenido!',
                text: 'Ha iniciado sesión correctamente.',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500
            }).then(() => navigate('/'));
        } catch (error) {
            Swal.fire({
                title: 'Error de Acceso',
                text: 'Usuario o contraseña incorrectos.',
                icon: 'error',
                confirmButtonColor: '#c1121f'
            });
        }
    };

    return (
        <div style={loginPageStyle}>
            <Link to="/" style={backNavStyle}>
                <i className="fas fa-arrow-left"></i>
                <span>Volver</span>
            </Link>

            <div className="login-card" style={loginCardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <i className="fas fa-film" style={{ fontSize: '3.5rem', color: '#c1121f', marginBottom: '1.5rem' }}></i>
                    <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>Acceso Socios</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label style={labelStyle}>Usuario</label>
                        <input type="text" required placeholder="Nombre de usuario" value={username}
                            onChange={e => setUsername(e.target.value)} style={inputStyle} />
                    </div>
                    <div className="input-group" style={{ marginBottom: '2rem' }}>
                        <label style={labelStyle}>Contraseña</label>
                        <input type="password" required placeholder="contraseña" value={password}
                            onChange={e => setPassword(e.target.value)} style={inputStyle} />
                    </div>
                    <button type="submit" style={btnLoginStyle}>Entrar</button>
                </form>

                <div style={{ marginTop: '2.5rem', textAlign: 'center', color: '#6c757d', fontSize: '1rem' }}>
                    ¿No tiene una cuenta? <Link to="/register" style={{ color: '#c1121f', textDecoration: 'none', fontWeight: 700 }}>Únase a CineMerk</Link>
                </div>
            </div>
        </div>
    );
}

const loginPageStyle = {
    backgroundColor: '#f8f9fa', color: '#212529', margin: 0, padding: 0,
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Outfit', sans-serif"
};
const loginCardStyle = {
    width: '100%', maxWidth: 420, background: '#ffffff', borderRadius: 16, padding: '3.5rem',
    boxShadow: '0 15px 35px rgba(0,0,0,0.08)', border: '1px solid #dee2e6'
};
const labelStyle = { display: 'block', color: '#495057', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.6rem' };
const inputStyle = {
    width: '100%', padding: '0.9rem', border: '2px solid #e9ecef', borderRadius: 10,
    fontSize: '1rem', boxSizing: 'border-box'
};
const btnLoginStyle = {
    width: '100%', background: '#c1121f', color: '#fff', border: 'none', padding: '1.1rem',
    borderRadius: 10, fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer'
};
const backNavStyle = {
    position: 'fixed', top: '2rem', left: '2rem', color: '#495057', textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700
};
