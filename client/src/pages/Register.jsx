import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [form, setForm] = useState({
        firstName: '', lastName: '', username: '', email: '', phone: '',
        idType: 'fisica', idCard: '', birthDate: '', password: ''
    });
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userData = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone,
            email: form.email,
            idType: form.idType,
            idCard: form.idCard,
            birthDate: form.birthDate,
            username: form.username.trim(),
            password: form.password
        };
        try {
            await register(userData);
            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Cuenta creada con éxito.',
                confirmButtonColor: '#c1121f'
            }).then(() => navigate('/'));
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al crear cuenta.',
                confirmButtonColor: '#c1121f'
            });
        }
    };

    return (
        <div style={pageStyle}>
            <div style={{ textAlign: 'left', marginBottom: 20, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
                <Link to="/login" style={{ color: '#666', textDecoration: 'none', fontWeight: 700 }}>← Volver a iniciar sesión</Link>
            </div>

            <div style={containerStyle}>
                <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-user-plus" style={{ fontSize: '3rem', color: '#c1121f' }}></i>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '10px 0' }}>Crear Cuenta</h1>
                    <p>Por favor llene los datos:</p>
                </div>

                <br /><br />

                <form onSubmit={handleSubmit}>
                    <Field label="Nombre"><input type="text" name="firstName" required value={form.firstName} onChange={handleChange} style={inputStyle} /></Field>
                    <br />
                    <Field label="Apellido"><input type="text" name="lastName" required value={form.lastName} onChange={handleChange} style={inputStyle} /></Field>
                    <br />
                    <Field label="Nombre de Usuario"><input type="text" name="username" required value={form.username} onChange={handleChange} style={inputStyle} /></Field>
                    <br />
                    <Field label="Correo Electrónico"><input type="email" name="email" required value={form.email} onChange={handleChange} style={inputStyle} /></Field>
                    <br />
                    <Field label="Teléfono"><input type="tel" name="phone" required value={form.phone} onChange={handleChange} style={inputStyle} /></Field>
                    <br />
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Tipo de Documento</label>
                        <select name="idType" required value={form.idType} onChange={handleChange} style={{ ...inputStyle, marginBottom: 15 }}>
                            <option value="fisica">Cédula Física</option>
                            <option value="dimex">DIMEX (Extranjero)</option>
                        </select>
                        <label style={labelStyle}>Número de Documento</label>
                        <input type="text" name="idCard" required placeholder="1-2345-6789" value={form.idCard} onChange={handleChange} style={inputStyle} />
                    </div>
                    <br />
                    <Field label="Fecha de Nacimiento"><input type="date" name="birthDate" required value={form.birthDate} onChange={handleChange} style={inputStyle} /></Field>
                    <br />
                    <Field label="Contraseña"><input type="password" name="password" required value={form.password} onChange={handleChange} style={inputStyle} /></Field>
                    <br /><br />

                    <button type="submit" style={btnGrandeStyle}>REGISTRARSE AHORA</button>

                    <br /><br />

                    <div style={{ textAlign: 'center' }}>
                        ¿Ya tiene cuenta? <Link to="/login" style={{ color: '#c1121f', fontWeight: 700, textDecoration: 'none' }}>Inicie Sesión</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{label}</label>
            {children}
        </div>
    );
}

const pageStyle = {
    backgroundColor: '#f0f2f5', overflowY: 'auto', height: 'auto', padding: '50px 10px', display: 'block', minHeight: '100vh'
};
const containerStyle = {
    width: '100%', maxWidth: 500, margin: '0 auto', background: '#ffffff', borderRadius: 15,
    padding: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #ddd'
};
const labelStyle = { display: 'block', fontWeight: 700, marginBottom: 8, color: '#333' };
const inputStyle = {
    width: '100%', padding: 15, border: '1px solid #ccc', borderRadius: 8, fontSize: '1.1rem',
    boxSizing: 'border-box', backgroundColor: 'white', fontFamily: 'inherit'
};
const btnGrandeStyle = {
    width: '100%', backgroundColor: '#c1121f', color: 'white', border: 'none', padding: 20,
    fontSize: '1.3rem', fontWeight: 800, borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
};
