import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Sortable from 'sortablejs';
import { useAuth } from '../context/AuthContext';

const ADMIN_PRIMARY = '#003566';

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function useSortableTable(ref, resourceName, deps) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const instance = new Sortable(el, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: async () => {
                const rows = el.querySelectorAll('tr[data-id]');
                const order = Array.from(rows).map(row => row.getAttribute('data-id'));
                if (order.length > 0) {
                    try {
                        const res = await fetch(`/api/${resourceName}/reorder`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order })
                        });
                        if (res.ok) {
                            Swal.fire({ toast: true, position: 'bottom-end', icon: 'success', title: 'Orden guardado', showConfirmButton: false, timer: 1000 });
                        }
                    } catch (e) { console.error(e); }
                }
            }
        });
        return () => instance.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

export default function Admin() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') {
            navigate('/');
        }
    }, [currentUser, navigate]);

    // Dashboard
    const [stats, setStats] = useState({ movies: 0, rooms: 0, users: 0, tickets: 0, revenue: 0 });

    // Movies
    const [movies, setMovies] = useState([]);
    const [movieModalOpen, setMovieModalOpen] = useState(false);
    const [movieForm, setMovieForm] = useState(emptyMovie());
    const movieTbodyRef = useRef(null);

    // Rooms
    const [rooms, setRooms] = useState([]);
    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [roomForm, setRoomForm] = useState(emptyRoom());
    const roomTbodyRef = useRef(null);

    // Combos
    const [combos, setCombos] = useState([]);
    const [comboModalOpen, setComboModalOpen] = useState(false);
    const [comboForm, setComboForm] = useState(emptyCombo());
    const comboTbodyRef = useRef(null);

    // Users
    const [allUsers, setAllUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');

    // Tickets
    const [allTickets, setAllTickets] = useState([]);
    const [ticketSearch, setTicketSearch] = useState('');

    function emptyMovie() {
        return { id: '', title: '', genre: '', duration: '', synopsis: '', classification: 'TE', dates: '', times: '', status: 'active', image: '' };
    }
    function emptyRoom() {
        return { id: '', name: '', type: '2D', capacity: '', status: 'operativa' };
    }
    function emptyCombo() {
        return { id: '', name: '', description: '', price: '', size: 'Pequeño', image: '', status: 'activo' };
    }

    const loadDashboard = useCallback(async () => {
        try {
            const [m, r, u, t] = await Promise.all([
                fetch('/api/movies').then(x => x.json()),
                fetch('/api/rooms').then(x => x.json()),
                fetch('/api/users').then(x => x.json()),
                fetch('/api/tickets/all').then(x => x.json()).catch(() => [])
            ]);
            const revenue = t.reduce((sum, tk) => {
                const n = parseInt((tk.price || '0').replace(/[^\d]/g, ''));
                return sum + (isNaN(n) ? 0 : n);
            }, 0);
            setStats({ movies: m.length, rooms: r.length, users: u.length, tickets: t.length, revenue });
        } catch (e) { console.error(e); }
    }, []);

    const loadMovies = useCallback(async () => {
        const res = await fetch('/api/movies');
        setMovies(await res.json());
    }, []);

    const loadRooms = useCallback(async () => {
        const res = await fetch('/api/rooms');
        setRooms(await res.json());
    }, []);

    const loadCombos = useCallback(async () => {
        const res = await fetch('/api/combos');
        setCombos(await res.json());
    }, []);

    const loadUsers = useCallback(async () => {
        const res = await fetch('/api/users');
        setAllUsers(await res.json());
    }, []);

    const loadTickets = useCallback(async () => {
        try {
            const res = await fetch('/api/tickets/all');
            if (!res.ok) throw new Error('Error al cargar entradas');
            setAllTickets(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') return;
        loadDashboard();
        loadMovies();
        loadRooms();
        loadUsers();
        loadTickets();
        loadCombos();
    }, [currentUser, loadDashboard, loadMovies, loadRooms, loadUsers, loadTickets, loadCombos]);

    useSortableTable(movieTbodyRef, 'movies', [movies]);
    useSortableTable(roomTbodyRef, 'rooms', [rooms]);
    useSortableTable(comboTbodyRef, 'combos', [combos]);

    if (!currentUser || currentUser.role !== 'admin') return null;

    const handleLogout = () => {
        Swal.fire({
            title: '¿Salir del panel?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: ADMIN_PRIMARY,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, salir'
        }).then(res => {
            if (res.isConfirmed) {
                logout();
                navigate('/');
            }
        });
    };

    // ─── MOVIES ───
    const openAddMovie = () => {
        setMovieForm(emptyMovie());
        setMovieModalOpen(true);
    };
    const editMovie = (id) => {
        const m = movies.find(x => x.id === id);
        if (!m) return;
        setMovieForm({
            id: m.id, title: m.title, genre: m.genre, duration: m.duration, synopsis: m.synopsis,
            classification: m.classification, dates: m.dates || '', times: m.times, status: m.status, image: m.image
        });
        setMovieModalOpen(true);
    };
    const submitMovie = async (e) => {
        e.preventDefault();
        const { id, ...data } = movieForm;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/movies/${id}` : '/api/movies';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        setMovieModalOpen(false);
        loadMovies();
        loadDashboard();
        Swal.fire({ icon: 'success', title: id ? 'Película actualizada' : 'Película añadida', timer: 1500, showConfirmButton: false });
    };
    const deleteMovie = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar película?', text: 'Esta acción no se puede deshacer.', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#c1121f', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/movies/${id}`, { method: 'DELETE' });
            loadMovies();
            loadDashboard();
            Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1200, showConfirmButton: false });
        }
    };
    const handleMovieImageFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        setMovieForm(f => ({ ...f, image: base64 }));
    };

    // ─── ROOMS ───
    const openAddRoom = () => {
        setRoomForm(emptyRoom());
        setRoomModalOpen(true);
    };
    const editRoom = (id) => {
        const r = rooms.find(x => x.id === id);
        if (!r) return;
        setRoomForm({ id: r.id, name: r.name, type: r.type, capacity: r.capacity, status: r.status });
        setRoomModalOpen(true);
    };
    const submitRoom = async (e) => {
        e.preventDefault();
        const { id, ...data } = roomForm;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/rooms/${id}` : '/api/rooms';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        setRoomModalOpen(false);
        loadRooms();
        loadDashboard();
        Swal.fire({ icon: 'success', title: id ? 'Sala actualizada' : 'Sala creada', timer: 1500, showConfirmButton: false });
    };
    const deleteRoom = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar sala?', icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#c1121f', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
            loadRooms();
            loadDashboard();
            Swal.fire({ icon: 'success', title: 'Sala eliminada', timer: 1200, showConfirmButton: false });
        }
    };

    // ─── COMBOS ───
    const openAddCombo = () => {
        setComboForm(emptyCombo());
        setComboModalOpen(true);
    };
    const editCombo = (c) => {
        setComboForm({ id: c.id, name: c.name, description: c.description, price: c.price, size: c.size, image: c.image, status: c.status });
        setComboModalOpen(true);
    };
    const submitCombo = async (e) => {
        e.preventDefault();
        const { id, ...rest } = comboForm;
        const data = { ...rest, type: 'combo' };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/combos/${id}` : '/api/combos';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        setComboModalOpen(false);
        loadCombos();
        Swal.fire({ icon: 'success', title: id ? 'Combo actualizado' : 'Combo guardado', timer: 1500, showConfirmButton: false });
    };
    const deleteCombo = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar combo?', icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#c1121f', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/combos/${id}`, { method: 'DELETE' });
            loadCombos();
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
        }
    };
    const handleComboImageFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        setComboForm(f => ({ ...f, image: base64 }));
    };

    // ─── USERS ───
    const toggleUserRole = async (id, role) => {
        const newRole = role === 'admin' ? 'user' : 'admin';
        const result = await Swal.fire({
            title: `¿Cambiar a "${newRole}"?`, icon: 'question', showCancelButton: true,
            confirmButtonColor: ADMIN_PRIMARY, cancelButtonText: 'Cancelar', confirmButtonText: 'Confirmar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Rol actualizado', timer: 1200, showConfirmButton: false });
        }
    };
    const deleteUser = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar usuario?', text: 'Se eliminarán todos sus datos.', icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#c1121f', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Usuario eliminado', timer: 1200, showConfirmButton: false });
        }
    };

    const filteredUsers = allUsers.filter(u => {
        const t = userSearch.toLowerCase();
        return (u.firstName || '').toLowerCase().includes(t) ||
            (u.lastName || '').toLowerCase().includes(t) ||
            (u.username || '').toLowerCase().includes(t) ||
            (u.email || '').toLowerCase().includes(t);
    });

    // ─── TICKETS ───
    const toggleTicketStatus = async (id, status) => {
        const ns = status === 'active' ? 'used' : 'active';
        await fetch(`/api/tickets/${id}/use`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: ns }) });
        loadTickets();
    };
    const deleteTicket = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar entrada?', icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#c1121f', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
            loadTickets();
            Swal.fire({ icon: 'success', title: 'Entrada eliminada', timer: 1200, showConfirmButton: false });
        }
    };

    const filteredTickets = allTickets.filter(x => {
        const t = ticketSearch.toLowerCase();
        return (x.movieTitle || x.name || '').toLowerCase().includes(t) ||
            (x.username || '').toLowerCase().includes(t) ||
            (x.roomName || '').toLowerCase().includes(t);
    });

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="logo">
                    <i className="fas fa-shield-halved"></i>
                    <span>Admin<span>Merk</span></span>
                </div>
                <nav className="nav-menu">
                    <a href="#section-stats" className="nav-item"><i className="fas fa-chart-line"></i> Panel de Control</a>
                    <a href="#section-movies" className="nav-item"><i className="fas fa-film"></i> Películas</a>
                    <a href="#section-rooms" className="nav-item"><i className="fas fa-door-open"></i> Salas</a>
                    <a href="#section-combos" className="nav-item"><i className="fas fa-hotdog"></i> Confitería</a>
                    <a href="#section-users" className="nav-item"><i className="fas fa-users-gear"></i> Usuarios</a>
                    <a href="#section-tickets" className="nav-item"><i className="fas fa-ticket-alt"></i> Entradas</a>
                </nav>
                <div className="sidebar-footer">
                    <a href="/combos" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '0.9rem' }}>
                        <i className="fas fa-external-link-alt"></i> Ver como Cliente
                    </a>
                    <p style={{ marginTop: 10 }}>© 2026 AdminMerk</p>
                </div>
            </aside>

            <main className="main-content">
                <header className="top-bar">
                    <h1 id="page-title">Panel de Control</h1>
                    <div className="user-profile">
                        <div id="user-info" className="profile-summary">
                            <img id="user-avatar" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.firstName)}&background=003566&color=fff`} alt="Admin" />
                            <span id="user-name-display">{currentUser.firstName}</span>
                            <button className="btn-logout" id="logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i></button>
                        </div>
                    </div>
                </header>

                <section id="section-stats" style={{ marginBottom: '3rem' }}>
                    <div className="stats-grid">
                        <StatCard icon="fa-film" label="Películas" value={stats.movies} />
                        <StatCard icon="fa-door-open" label="Salas" value={stats.rooms} />
                        <StatCard icon="fa-users" label="Usuarios" value={stats.users} />
                        <StatCard icon="fa-ticket-alt" label="Entradas" value={stats.tickets} />
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg,#003566,#001d3d)', color: 'white', border: 'none' }}>
                            <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}><i className="fas fa-coins"></i></div>
                            <div className="stat-info">
                                <h3 style={{ color: 'rgba(255,255,255,0.75)' }}>Ingresos Totales</h3>
                                <p style={{ color: 'white' }}>₡{stats.revenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="section-movies" style={{ marginBottom: '3rem' }}>
                    <div className="section-header">
                        <h2><i className="fas fa-film" style={{ color: '#003566' }}></i> Cartelera de Películas</h2>
                        <button id="add-movie-btn" className="btn btn-primary" onClick={openAddMovie}>
                            <i className="fas fa-plus"></i> Nueva Película
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr><th>Imagen</th><th>Título</th><th>Género</th><th>Horarios</th><th>Estado</th><th>Acciones</th></tr>
                            </thead>
                            <tbody id="admin-movies-list" ref={movieTbodyRef}>
                                {movies.length === 0 && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
                                        <i className="fas fa-film" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>No hay películas registradas
                                    </td></tr>
                                )}
                                {movies.map(m => (
                                    <tr key={m.id} data-id={m.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <i className="fas fa-grip-lines drag-handle" style={{ cursor: 'grab', color: '#ccc', marginRight: 15, fontSize: '1.2rem' }} title="Arrastrar para mover"></i>
                                                <img src={m.image} alt={m.title} width="48" height="68" style={{ borderRadius: 8, objectFit: 'cover' }} />
                                            </div>
                                        </td>
                                        <td><strong>{m.title}</strong><br /><span style={{ fontSize: '0.78rem', color: '#888' }}>{m.duration} · {m.classification}</span></td>
                                        <td>{m.genre}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{m.times || '—'}</td>
                                        <td><span className={`status-badge status-${m.status}`}>{m.status === 'active' ? 'Activa' : 'Inactiva'}</span></td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" title="Editar" onClick={() => editMovie(m.id)}><i className="fas fa-edit"></i></button>
                                            <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ color: '#c1121f' }} onClick={() => deleteMovie(m.id)}><i className="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="section-rooms" style={{ marginBottom: '3rem' }}>
                    <div className="section-header">
                        <h2><i className="fas fa-door-open" style={{ color: '#003566' }}></i> Administración de Salas</h2>
                        <button id="add-room-btn" className="btn btn-primary" onClick={openAddRoom}>
                            <i className="fas fa-plus"></i> Nueva Sala
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Nombre/No.</th><th>Tipo</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody id="admin-rooms-list" ref={roomTbodyRef}>
                                {rooms.length === 0 && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
                                        <i className="fas fa-door-open" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>No hay salas registradas
                                    </td></tr>
                                )}
                                {rooms.map(r => {
                                    const statusColor = r.status === 'operativa' ? '#2d6a4f' : r.status === 'mantenimiento' ? '#e76f51' : '#888';
                                    return (
                                        <tr key={r.id} data-id={r.id}>
                                            <td>
                                                <i className="fas fa-grip-lines drag-handle" style={{ cursor: 'grab', color: '#ccc', marginRight: 15, fontSize: '1.2rem' }} title="Arrastrar para mover"></i>
                                                <strong>{r.name}</strong>
                                            </td>
                                            <td><span style={{ background: '#e8f4fd', color: '#0077b6', padding: '3px 10px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700 }}>{r.type}</span></td>
                                            <td><i className="fas fa-users" style={{ color: '#aaa', marginRight: 5 }}></i>{r.capacity} asientos</td>
                                            <td><span className="status-badge" style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>{r.status}</span></td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" title="Editar" onClick={() => editRoom(r.id)}><i className="fas fa-edit"></i></button>
                                                <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ color: '#c1121f' }} onClick={() => deleteRoom(r.id)}><i className="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="section-combos" style={{ marginBottom: '3rem' }}>
                    <div className="section-header">
                        <h2><i className="fas fa-hotdog" style={{ color: '#f4a261' }}></i> Confitería y Combos</h2>
                        <button id="add-combo-btn" className="btn btn-primary" style={{ background: '#f4a261' }} onClick={openAddCombo}>
                            <i className="fas fa-plus"></i> Nuevo Combo/Producto
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Nombre</th><th>Tamaño</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody id="admin-combos-list" ref={comboTbodyRef}>
                                {combos.length === 0 && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No hay combos registrados</td></tr>
                                )}
                                {combos.map(c => (
                                    <tr key={c.id} data-id={c.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <i className="fas fa-grip-lines drag-handle" style={{ cursor: 'grab', color: '#ccc', marginRight: 15, fontSize: '1.2rem' }} title="Arrastrar para mover"></i>
                                                <img src={c.image} alt={c.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', marginRight: 10 }} />
                                                <div>
                                                    <span style={{ fontWeight: 700 }}>{c.name}</span><br />
                                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>{c.description.substring(0, 30)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge" style={{ background: '#f4a261', color: 'white' }}>{c.size}</span></td>
                                        <td style={{ fontWeight: 700 }}>{c.price}</td>
                                        <td><span className={`status-badge status-${c.status}`}>{c.status === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" title="Editar" onClick={() => editCombo(c)}><i className="fas fa-edit"></i></button>
                                            <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ color: '#c1121f' }} onClick={() => deleteCombo(c.id)}><i className="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="section-users" style={{ marginBottom: '3rem' }}>
                    <div className="section-header">
                        <h2><i className="fas fa-users-gear" style={{ color: '#003566' }}></i> Gestión de Usuarios</h2>
                        <div style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: 10, borderRadius: 10, width: 320, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <i className="fas fa-search" style={{ color: '#666' }}></i>
                            <input type="text" id="user-search" placeholder="Buscar usuario..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                style={{ border: 'none', outline: 'none', background: 'none', width: '100%', margin: 0, fontSize: '0.9rem' }} />
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Nombre Completo</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead>
                            <tbody id="users-table-body">
                                {filteredUsers.length === 0 && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No se encontraron usuarios</td></tr>
                                )}
                                {filteredUsers.map(u => {
                                    const isAdmin = u.role === 'admin';
                                    const isProtected = u.username === 'admin_admin';
                                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.firstName || u.username)}&background=${isAdmin ? '003566' : 'e0e0e0'}&color=${isAdmin ? 'fff' : '555'}&size=32`;
                                    return (
                                        <tr key={u.id}>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <img src={avatarUrl} alt={u.firstName || u.username} width="32" height="32" style={{ borderRadius: '50%' }} />
                                                <div><strong>{u.firstName} {u.lastName}</strong><br /><span style={{ fontSize: '0.75rem', color: '#aaa' }}>{u.email || '—'}</span></div>
                                            </td>
                                            <td><code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 5, fontSize: '0.85rem' }}>@{u.username}</code></td>
                                            <td>{u.email || '—'}</td>
                                            <td><span className={`badge ${isAdmin ? 'badge-primary' : ''}`} style={isAdmin ? { background: '#003566', color: 'white' } : {}}>{isAdmin ? '⭐ Admin' : 'Usuario'}</span></td>
                                            <td>
                                                {!isProtected ? (
                                                    <>
                                                        <button className="btn btn-secondary btn-sm" title={isAdmin ? 'Quitar admin' : 'Hacer admin'} onClick={() => toggleUserRole(u.id, u.role)}>
                                                            <i className="fas fa-user-shield"></i>
                                                        </button>
                                                        <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ color: '#c1121f' }} onClick={() => deleteUser(u.id)}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', color: '#aaa', padding: '4px 8px' }}>🔒 Sistema</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="section-tickets" style={{ marginBottom: '3rem' }}>
                    <div className="section-header">
                        <h2><i className="fas fa-ticket-alt" style={{ color: '#003566' }}></i> Control Global de Entradas</h2>
                        <div style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: 10, borderRadius: 10, width: 320, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <i className="fas fa-search" style={{ color: '#666' }}></i>
                            <input type="text" id="ticket-search" placeholder="Película o usuario..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)}
                                style={{ border: 'none', outline: 'none', background: 'none', width: '100%', margin: 0, fontSize: '0.9rem' }} />
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead><tr><th>Fecha</th><th>Película</th><th>Sala</th><th>Asientos</th><th>Usuario</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
                            <tbody id="admin-tickets-list">
                                {filteredTickets.length === 0 && (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>
                                        <i className="fas fa-ticket-alt" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}></i>No hay entradas registradas
                                    </td></tr>
                                )}
                                {filteredTickets.map(t => {
                                    const dateObj = new Date(t.date);
                                    const dateStr = isNaN(dateObj) ? '—' : dateObj.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
                                    const timeStr = isNaN(dateObj) ? '' : dateObj.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
                                    const isUsed = t.status === 'used';
                                    const statusColor = isUsed ? '#888' : '#2d6a4f';
                                    const statusLabel = isUsed ? 'Usado' : 'Activo';
                                    const seatsStr = Array.isArray(t.seats) && t.seats.length > 0 ? t.seats.join(', ') : '—';
                                    const isFood = t.type === 'food' || !t.movieId;
                                    return (
                                        <tr key={t.id} style={isUsed ? { opacity: 0.65 } : {}}>
                                            <td><span style={{ fontWeight: 600, display: 'block' }}>{dateStr}</span><span style={{ fontSize: '0.75rem', color: '#aaa' }}>{timeStr}</span></td>
                                            <td>
                                                {isFood ? <i className="fas fa-hotdog" style={{ color: '#f4a261' }}></i> : <i className="fas fa-ticket-alt" style={{ color: '#c1121f' }}></i>}
                                                <strong style={{ marginLeft: 6 }}>{t.movieTitle || t.name || '—'}</strong><br />
                                                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Hora: {t.time || '—'}</span>
                                            </td>
                                            <td>{t.roomName || '—'}</td>
                                            <td><span style={{ background: '#f5f5f5', padding: '3px 8px', borderRadius: 6, fontSize: '0.78rem', fontFamily: 'monospace' }}>{seatsStr}</span></td>
                                            <td>@{t.username || '—'}</td>
                                            <td style={{ fontWeight: 700, color: '#003566' }}>{t.price || '—'}</td>
                                            <td><span style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40`, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>{statusLabel}</span></td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" title={isUsed ? 'Marcar activo' : 'Marcar usado'} onClick={() => toggleTicketStatus(t.id, t.status)}>
                                                    <i className={`fas ${isUsed ? 'fa-undo' : 'fa-check'}`}></i>
                                                </button>
                                                <button className="btn btn-secondary btn-sm" title="Eliminar" style={{ color: '#c1121f' }} onClick={() => deleteTicket(t.id)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {movieModalOpen && (
                <div className="modal active">
                    <div className="modal-content">
                        <header className="modal-header">
                            <h2><i className="fas fa-film"></i> <span>{movieForm.id ? 'Editar Película' : 'Añadir Película'}</span></h2>
                            <button className="close-modal" onClick={() => setMovieModalOpen(false)}>&times;</button>
                        </header>
                        <form onSubmit={submitMovie}>
                            <div className="form-group">
                                <label><i className="fas fa-heading"></i> Título</label>
                                <input type="text" required placeholder="Ej: Avengers: Endgame" value={movieForm.title}
                                    onChange={e => setMovieForm(f => ({ ...f, title: e.target.value }))} />
                            </div>
                            <div className="modal-grid-2">
                                <div className="form-group">
                                    <label><i className="fas fa-masks-theater"></i> Género</label>
                                    <input type="text" required placeholder="Acción, Drama..." value={movieForm.genre}
                                        onChange={e => setMovieForm(f => ({ ...f, genre: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-clock"></i> Duración (min)</label>
                                    <input type="text" required placeholder="120" value={movieForm.duration}
                                        onChange={e => setMovieForm(f => ({ ...f, duration: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label><i className="fas fa-align-left"></i> Sinopsis</label>
                                <textarea required placeholder="Describe brevemente la película..." value={movieForm.synopsis}
                                    onChange={e => setMovieForm(f => ({ ...f, synopsis: e.target.value }))}></textarea>
                            </div>
                            <div className="modal-grid-2">
                                <div className="form-group">
                                    <label><i className="fas fa-shield-alt"></i> Clasificación</label>
                                    <select value={movieForm.classification} onChange={e => setMovieForm(f => ({ ...f, classification: e.target.value }))}>
                                        <option value="TE">TE — Todo público</option>
                                        <option value="7+">7+ — Mayores de 7</option>
                                        <option value="12+">12+ — Mayores de 12</option>
                                        <option value="15+">15+ — Mayores de 15</option>
                                        <option value="18+">18+ — Solo adultos</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-toggle-on"></i> Estado</label>
                                    <select value={movieForm.status} onChange={e => setMovieForm(f => ({ ...f, status: e.target.value }))}>
                                        <option value="active">✅ Activa</option>
                                        <option value="inactive">❌ Inactiva</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label><i className="fas fa-calendar-days"></i> Fechas en cartelera</label>
                                <input type="text" placeholder="Ej: 15 Ene — 28 Feb" value={movieForm.dates}
                                    onChange={e => setMovieForm(f => ({ ...f, dates: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label><i className="fas fa-clock"></i> Horarios (separados por coma)</label>
                                <input type="text" placeholder="14:00, 17:30, 20:00" value={movieForm.times}
                                    onChange={e => setMovieForm(f => ({ ...f, times: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label><i className="fas fa-image"></i> Imagen (URL o Subir Archivo)</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <input type="text" placeholder="https://..." style={{ flex: 1 }} value={movieForm.image}
                                        onChange={e => setMovieForm(f => ({ ...f, image: e.target.value }))} />
                                    <button type="button" className="btn btn-secondary" style={{ padding: '0 15px', borderRadius: 8 }}
                                        onClick={() => document.getElementById('movie-file').click()}>
                                        <i className="fas fa-folder-open"></i> Explorar
                                    </button>
                                    <input type="file" id="movie-file" accept="image/*" style={{ display: 'none' }} onChange={handleMovieImageFile} />
                                </div>
                                <div className="img-preview-box">
                                    {movieForm.image ? (
                                        <img src={movieForm.image} alt="Vista previa" style={{ display: 'block' }} />
                                    ) : (
                                        <span><i className="fas fa-image" style={{ fontSize: '2rem', marginBottom: 6, display: 'block' }}></i>Vista previa del póster</span>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setMovieModalOpen(false)}><i className="fas fa-times"></i> Cancelar</button>
                                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Guardar Película</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {roomModalOpen && (
                <div className="modal active">
                    <div className="modal-content">
                        <header className="modal-header">
                            <h2><i className="fas fa-door-open"></i> <span>{roomForm.id ? 'Editar Sala' : 'Nueva Sala'}</span></h2>
                            <button className="close-modal" onClick={() => setRoomModalOpen(false)}>&times;</button>
                        </header>
                        <form onSubmit={submitRoom}>
                            <div className="form-group">
                                <label><i className="fas fa-tag"></i> Nombre / Número de sala</label>
                                <input type="text" required placeholder="Ej: Sala 1, Sala IMAX" value={roomForm.name}
                                    onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="modal-grid-2">
                                <div className="form-group">
                                    <label><i className="fas fa-film"></i> Tipo de sala</label>
                                    <select value={roomForm.type} onChange={e => setRoomForm(f => ({ ...f, type: e.target.value }))}>
                                        <option value="2D">🎬 2D — Estándar</option>
                                        <option value="3D">🥽 3D — Tridimensional</option>
                                        <option value="IMAX">🔭 IMAX — Gran formato</option>
                                        <option value="VIP">⭐ VIP — Premium</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-users"></i> Capacidad (personas)</label>
                                    <input type="number" required placeholder="100" min="1" value={roomForm.capacity}
                                        onChange={e => setRoomForm(f => ({ ...f, capacity: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label><i className="fas fa-circle-dot"></i> Estado operativo</label>
                                <select value={roomForm.status} onChange={e => setRoomForm(f => ({ ...f, status: e.target.value }))}>
                                    <option value="operativa">✅ Operativa</option>
                                    <option value="mantenimiento">🔧 En mantenimiento</option>
                                    <option value="clausurada">🚫 Clausurada</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setRoomModalOpen(false)}><i className="fas fa-times"></i> Cancelar</button>
                                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Guardar Sala</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {comboModalOpen && (
                <div className="modal active">
                    <div className="modal-content">
                        <header className="modal-header">
                            <h2><i className="fas fa-hotdog"></i> <span>{comboForm.id ? 'Editar Combo' : 'Añadir Combo'}</span></h2>
                            <button className="close-modal" onClick={() => setComboModalOpen(false)}>&times;</button>
                        </header>
                        <form onSubmit={submitCombo}>
                            <div className="form-group">
                                <label><i className="fas fa-tag"></i> Nombre del Producto/Combo</label>
                                <input type="text" required placeholder="Ej: Combo Pareja Premium" value={comboForm.name}
                                    onChange={e => setComboForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label><i className="fas fa-align-left"></i> Descripción (Productos incluidos)</label>
                                <textarea required placeholder="2 palomitas grandes, 2 refrescos medianos..." value={comboForm.description}
                                    onChange={e => setComboForm(f => ({ ...f, description: e.target.value }))}></textarea>
                            </div>
                            <div className="modal-grid-2">
                                <div className="form-group">
                                    <label><i className="fas fa-money-bill"></i> Precio</label>
                                    <input type="text" required placeholder="Ej: ₡15900" value={comboForm.price}
                                        onChange={e => setComboForm(f => ({ ...f, price: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-expand"></i> Tamaño</label>
                                    <select value={comboForm.size} onChange={e => setComboForm(f => ({ ...f, size: e.target.value }))}>
                                        <option value="Pequeño">Pequeño</option>
                                        <option value="Mediano">Mediano</option>
                                        <option value="Grande">Grande</option>
                                        <option value="Extragrande">Extragrande</option>
                                        <option value="Élite">Élite</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-grid-2">
                                <div className="form-group">
                                    <label><i className="fas fa-image"></i> Imagen (URL o Archivo)</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <input type="text" required placeholder="https://..." style={{ flex: 1 }} value={comboForm.image}
                                            onChange={e => setComboForm(f => ({ ...f, image: e.target.value }))} />
                                        <button type="button" className="btn btn-secondary" style={{ padding: '0 15px', borderRadius: 8 }}
                                            onClick={() => document.getElementById('combo-file').click()}>
                                            <i className="fas fa-folder-open"></i> Explorar
                                        </button>
                                        <input type="file" id="combo-file" accept="image/*" style={{ display: 'none' }} onChange={handleComboImageFile} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label><i className="fas fa-circle-dot"></i> Estado</label>
                                    <select value={comboForm.status} onChange={e => setComboForm(f => ({ ...f, status: e.target.value }))}>
                                        <option value="activo">✅ Activo</option>
                                        <option value="inactivo">🚫 Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{ textAlign: 'center', marginTop: 10 }}>
                                <div style={{ width: '100%', height: 180, border: '2px dashed #ddd', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fafafa' }}>
                                    {comboForm.image ? (
                                        <img src={comboForm.image} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ color: '#bbb', fontSize: '0.9rem' }}><i className="fas fa-image" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 5 }}></i>Vista Previa</span>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setComboModalOpen(false)}><i className="fas fa-times"></i> Cancelar</button>
                                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Guardar Combo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="stat-card">
            <div className="stat-icon"><i className={`fas ${icon}`}></i></div>
            <div className="stat-info">
                <h3>{label}</h3>
                <p>{value}</p>
            </div>
        </div>
    );
}
