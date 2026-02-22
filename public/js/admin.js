document.addEventListener('DOMContentLoaded', () => {
    let currentUser = JSON.parse(localStorage.getItem('cinema_user')) || null;

    // SECURITY CHECK
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    const ADMIN_PRIMARY = '#003566';

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        Swal.fire({
            title: '¿Salir del panel?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: ADMIN_PRIMARY,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, salir'
        }).then(res => {
            if (res.isConfirmed) {
                localStorage.removeItem('cinema_user');
                window.location.href = 'index.html';
            }
        });
    });

    // Display admin info
    document.getElementById('user-name-display').textContent = currentUser.firstName;
    document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.firstName)}&background=003566&color=fff`;

    // ─── DASHBOARD ───────────────────────────────────────────────
    async function loadDashboard() {
        try {
            const [movies, rooms, users, tickets] = await Promise.all([
                fetch('/api/movies').then(r => r.json()),
                fetch('/api/rooms').then(r => r.json()),
                fetch('/api/users').then(r => r.json()),
                fetch('/api/tickets/all').then(r => r.json()).catch(() => [])
            ]);

            document.getElementById('movie-count').textContent = movies.length;
            document.getElementById('room-count').textContent = rooms.length;
            document.getElementById('user-count').textContent = users.length;

            const ticketCountEl = document.getElementById('ticket-count');
            const revenueEl = document.getElementById('revenue-total');
            if (ticketCountEl) ticketCountEl.textContent = tickets.length;
            if (revenueEl) {
                const total = tickets.reduce((sum, t) => {
                    const n = parseInt((t.price || '0').replace(/[^\d]/g, ''));
                    return sum + (isNaN(n) ? 0 : n);
                }, 0);
                revenueEl.textContent = `₡${total.toLocaleString()}`;
            }
        } catch (e) { console.error(e); }
    }

    // ─── MOVIES ──────────────────────────────────────────────────
    const movieModal = document.getElementById('movie-modal');
    const movieForm = document.getElementById('movie-form');

    document.getElementById('add-movie-btn').onclick = () => {
        movieForm.reset();
        document.getElementById('movie-id').value = '';
        document.getElementById('movie-modal-title').textContent = 'Añadir Película';
        movieModal.classList.add('active');
    };

    movieForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('movie-id').value;
        const data = {
            title: document.getElementById('movie-title').value,
            genre: document.getElementById('movie-genre').value,
            duration: document.getElementById('movie-duration').value,
            synopsis: document.getElementById('movie-synopsis').value,
            classification: document.getElementById('movie-classification').value,
            dates: document.getElementById('movie-dates') ? document.getElementById('movie-dates').value : '',
            times: document.getElementById('movie-times').value,
            status: document.getElementById('movie-status').value,
            image: document.getElementById('movie-image').value
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/movies/${id}` : '/api/movies';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        movieModal.classList.remove('active');
        loadMovies();
        Swal.fire({ icon: 'success', title: id ? 'Película actualizada' : 'Película añadida', timer: 1500, showConfirmButton: false });
    };

    async function loadMovies() {
        const res = await fetch('/api/movies');
        const movies = await res.json();
        const tbody = document.getElementById('admin-movies-list');
        if (movies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#aaa;"><i class="fas fa-film" style="font-size:2rem; display:block; margin-bottom:8px;"></i>No hay películas registradas</td></tr>';
            return;
        }
        tbody.innerHTML = movies.map(m => `
            <tr data-id="${m.id}">
                <td>
                    <div style="display:flex; align-items:center;">
                        <i class="fas fa-grip-lines drag-handle" style="cursor: grab; color: #ccc; margin-right: 15px; font-size: 1.2rem;" title="Arrastrar para mover"></i>
                        <img src="${m.image}" width="48" height="68" style="border-radius:8px; object-fit:cover;">
                    </div>
                </td>
                <td>
                    <strong>${m.title}</strong><br>
                    <span style="font-size:0.78rem; color:#888;">${m.duration} · ${m.classification}</span>
                </td>
                <td>${m.genre}</td>
                <td style="font-size:0.82rem;">${m.times || '—'}</td>
                <td><span class="status-badge status-${m.status}">${m.status === 'active' ? 'Activa' : 'Inactiva'}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" title="Editar" onclick="editMovie('${m.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-secondary btn-sm" title="Eliminar" style="color:#c1121f;" onclick="deleteMovie('${m.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        initSortableTable('admin-movies-list', 'movies');
    }

    window.editMovie = async (id) => {
        const res = await fetch('/api/movies');
        const movies = await res.json();
        const m = movies.find(x => x.id === id);
        if (!m) return;
        document.getElementById('movie-id').value = m.id;
        document.getElementById('movie-title').value = m.title;
        document.getElementById('movie-genre').value = m.genre;
        document.getElementById('movie-duration').value = m.duration;
        document.getElementById('movie-synopsis').value = m.synopsis;
        document.getElementById('movie-classification').value = m.classification;
        document.getElementById('movie-times').value = m.times;
        document.getElementById('movie-status').value = m.status;
        document.getElementById('movie-image').value = m.image;
        if (document.getElementById('movie-dates')) document.getElementById('movie-dates').value = m.dates || '';
        document.getElementById('movie-modal-title').textContent = 'Editar Película';
        movieModal.classList.add('active');
    };

    window.deleteMovie = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar película?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c1121f',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/movies/${id}`, { method: 'DELETE' });
            loadMovies();
            Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1200, showConfirmButton: false });
        }
    };

    // ─── ROOMS ───────────────────────────────────────────────────
    const roomModal = document.getElementById('room-modal');
    const roomForm = document.getElementById('room-form');

    document.getElementById('add-room-btn').onclick = () => {
        roomForm.reset();
        document.getElementById('room-id').value = '';
        document.getElementById('room-modal-title').textContent = 'Nueva Sala';
        roomModal.classList.add('active');
    };

    roomForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('room-id').value;
        const data = {
            name: document.getElementById('room-name').value,
            type: document.getElementById('room-type').value,
            capacity: document.getElementById('room-capacity').value,
            status: document.getElementById('room-status').value
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/rooms/${id}` : '/api/rooms';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        roomModal.classList.remove('active');
        loadRooms();
        Swal.fire({ icon: 'success', title: id ? 'Sala actualizada' : 'Sala creada', timer: 1500, showConfirmButton: false });
    };

    async function loadRooms() {
        const res = await fetch('/api/rooms');
        const rooms = await res.json();
        const tbody = document.getElementById('admin-rooms-list');
        if (rooms.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#aaa;"><i class="fas fa-door-open" style="font-size:2rem; display:block; margin-bottom:8px;"></i>No hay salas registradas</td></tr>';
            return;
        }
        tbody.innerHTML = rooms.map(r => {
            const statusColor = r.status === 'operativa' ? '#2d6a4f' : r.status === 'mantenimiento' ? '#e76f51' : '#888';
            return `
            <tr data-id="${r.id}">
                <td>
                    <i class="fas fa-grip-lines drag-handle" style="cursor: grab; color: #ccc; margin-right: 15px; font-size: 1.2rem;" title="Arrastrar para mover"></i>
                    <strong>${r.name}</strong>
                </td>
                <td><span style="background:#e8f4fd; color:#0077b6; padding:3px 10px; border-radius:20px; font-size:0.82rem; font-weight:700;">${r.type}</span></td>
                <td><i class="fas fa-users" style="color:#aaa; margin-right:5px;"></i>${r.capacity} asientos</td>
                <td><span class="status-badge" style="background:${statusColor}20; color:${statusColor}; border:1px solid ${statusColor}40;">${r.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" title="Editar" onclick="editRoom('${r.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-secondary btn-sm" title="Eliminar" style="color:#c1121f" onclick="deleteRoom('${r.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
        initSortableTable('admin-rooms-list', 'rooms');
    }

    window.editRoom = async (id) => {
        const res = await fetch('/api/rooms');
        const rooms = await res.json();
        const r = rooms.find(x => x.id === id);
        if (!r) return;
        document.getElementById('room-id').value = r.id;
        document.getElementById('room-name').value = r.name;
        document.getElementById('room-type').value = r.type;
        document.getElementById('room-capacity').value = r.capacity;
        document.getElementById('room-status').value = r.status;
        document.getElementById('room-modal-title').textContent = 'Editar Sala';
        roomModal.classList.add('active');
    };

    window.deleteRoom = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar sala?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c1121f',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
            loadRooms();
            Swal.fire({ icon: 'success', title: 'Sala eliminada', timer: 1200, showConfirmButton: false });
        }
    };

    window.initSortableTable = (tbodyId, resourceName) => {
        const el = document.getElementById(tbodyId);
        if (el && window.Sortable) {
            if (el.sortableInstance) el.sortableInstance.destroy();
            el.sortableInstance = new Sortable(el, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                onEnd: async function () {
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
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            });
        }
    };

    // ─── USERS ───────────────────────────────────────────────────
    let allUsers = [];
    async function loadUsers() {
        const res = await fetch('/api/users');
        allUsers = await res.json();
        renderUsers(allUsers);
    }

    function renderUsers(users) {
        const tbody = document.getElementById('users-table-body');
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#aaa;">No se encontraron usuarios</td></tr>';
            return;
        }
        tbody.innerHTML = users.map(u => {
            const isAdmin = u.role === 'admin';
            const isProtected = u.username === 'admin_admin';
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.firstName || u.username)}&background=${isAdmin ? '003566' : 'e0e0e0'}&color=${isAdmin ? 'fff' : '555'}&size=32`;
            return `
            <tr>
                <td style="display:flex; align-items:center; gap:10px;">
                    <img src="${avatarUrl}" width="32" height="32" style="border-radius:50%;">
                    <div>
                        <strong>${u.firstName} ${u.lastName}</strong><br>
                        <span style="font-size:0.75rem; color:#aaa;">${u.email || '—'}</span>
                    </div>
                </td>
                <td><code style="background:#f5f5f5; padding:2px 8px; border-radius:5px; font-size:0.85rem;">@${u.username}</code></td>
                <td>${u.email || '—'}</td>
                <td><span class="badge ${isAdmin ? 'badge-primary' : ''}" style="${isAdmin ? 'background:#003566;color:white;' : ''}">${isAdmin ? '⭐ Admin' : 'Usuario'}</span></td>
                <td>
                    ${!isProtected ? `
                        <button class="btn btn-secondary btn-sm" title="${isAdmin ? 'Quitar admin' : 'Hacer admin'}" onclick="toggleUserRole('${u.id}', '${u.role}')">
                            <i class="fas fa-user-shield"></i>
                        </button>
                        <button class="btn btn-secondary btn-sm" title="Eliminar" style="color:#c1121f" onclick="deleteUser('${u.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '<span style="font-size:0.75rem; color:#aaa; padding:4px 8px;">🔒 Sistema</span>'}
                </td>
            </tr>`;
        }).join('');
    }

    window.toggleUserRole = async (id, role) => {
        const newRole = role === 'admin' ? 'user' : 'admin';
        const result = await Swal.fire({
            title: `¿Cambiar a "${newRole}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: ADMIN_PRIMARY,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Confirmar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Rol actualizado', timer: 1200, showConfirmButton: false });
        }
    };

    window.deleteUser = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar usuario?',
            text: 'Se eliminarán todos sus datos.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c1121f',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Usuario eliminado', timer: 1200, showConfirmButton: false });
        }
    };

    document.getElementById('user-search').oninput = (e) => {
        const t = e.target.value.toLowerCase();
        renderUsers(allUsers.filter(u =>
            (u.firstName || '').toLowerCase().includes(t) ||
            (u.lastName || '').toLowerCase().includes(t) ||
            (u.username || '').toLowerCase().includes(t) ||
            (u.email || '').toLowerCase().includes(t)
        ));
    };

    // ─── TICKETS ─────────────────────────────────────────────────
    let allTickets = [];
    async function loadTickets() {
        try {
            const res = await fetch('/api/tickets/all');
            if (!res.ok) throw new Error('Error al cargar entradas');
            allTickets = await res.json();
            renderTickets(allTickets);
        } catch (e) {
            console.error(e);
            document.getElementById('admin-tickets-list').innerHTML =
                '<tr><td colspan="8" style="text-align:center;color:#aaa;padding:2rem;">Error cargando entradas</td></tr>';
        }
    }

    function renderTickets(tickets) {
        const tbody = document.getElementById('admin-tickets-list');
        if (!tickets || tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem; color:#aaa;"><i class="fas fa-ticket-alt" style="font-size:2rem; display:block; margin-bottom:8px;"></i>No hay entradas registradas</td></tr>';
            return;
        }
        tbody.innerHTML = tickets.map(t => {
            const dateObj = new Date(t.date);
            const dateStr = isNaN(dateObj) ? '—' : dateObj.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = isNaN(dateObj) ? '' : dateObj.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
            const isUsed = t.status === 'used';
            const statusColor = isUsed ? '#888' : '#2d6a4f';
            const statusLabel = isUsed ? 'Usado' : 'Activo';
            const seatsStr = Array.isArray(t.seats) && t.seats.length > 0 ? t.seats.join(', ') : '—';
            const isFood = t.type === 'food' || !t.movieId;
            const typeIcon = isFood
                ? '<i class="fas fa-hotdog" style="color:#f4a261;"></i>'
                : '<i class="fas fa-ticket-alt" style="color:#c1121f;"></i>';
            return `
            <tr style="${isUsed ? 'opacity:0.65;' : ''}">
                <td>
                    <span style="font-weight:600; display:block;">${dateStr}</span>
                    <span style="font-size:0.75rem; color:#aaa;">${timeStr}</span>
                </td>
                <td>
                    ${typeIcon}
                    <strong style="margin-left:6px;">${t.movieTitle || t.name || '—'}</strong><br>
                    <span style="font-size:0.75rem; color:#aaa;">Hora: ${t.time || '—'}</span>
                </td>
                <td>${t.roomName || '—'}</td>
                <td>
                    <span style="background:#f5f5f5; padding:3px 8px; border-radius:6px; font-size:0.78rem; font-family:monospace;">${seatsStr}</span>
                </td>
                <td>@${t.username || '—'}</td>
                <td style="font-weight:700; color:#003566;">${t.price || '—'}</td>
                <td>
                    <span style="background:${statusColor}20; color:${statusColor}; border:1px solid ${statusColor}40;
                        padding:3px 10px; border-radius:20px; font-size:0.78rem; font-weight:700;">${statusLabel}</span>
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" title="${isUsed ? 'Marcar activo' : 'Marcar usado'}"
                        onclick="toggleTicketStatus('${t.id}', '${t.status}')">
                        <i class="fas ${isUsed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" title="Eliminar" style="color:#c1121f"
                        onclick="deleteTicket('${t.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    window.toggleTicketStatus = async (id, status) => {
        const ns = status === 'active' ? 'used' : 'active';
        await fetch(`/api/tickets/${id}/use`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: ns }) });
        loadTickets();
    };
    window.deleteTicket = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar entrada?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c1121f',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
            loadTickets();
            Swal.fire({ icon: 'success', title: 'Entrada eliminada', timer: 1200, showConfirmButton: false });
        }
    };

    document.getElementById('ticket-search').oninput = (e) => {
        const t = e.target.value.toLowerCase();
        renderTickets(allTickets.filter(x =>
            (x.movieTitle || x.name || '').toLowerCase().includes(t) ||
            (x.username || '').toLowerCase().includes(t) ||
            (x.roomName || '').toLowerCase().includes(t)
        ));
    };


    // ─── MODALS CLOSE ────────────────────────────────────────────
    document.querySelectorAll('.close-modal').forEach(b => {
        b.onclick = () => document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    });

    // ─── COMBOS (CONFITERÍA) ──────────────────────────────────────
    const comboModal = document.getElementById('combo-modal');
    const comboForm = document.getElementById('combo-form');

    document.getElementById('add-combo-btn').onclick = () => {
        comboForm.reset();
        document.getElementById('combo-id').value = '';
        document.getElementById('combo-modal-title').textContent = 'Añadir Combo';
        previewImg('', 'combo-img-preview', 'combo-img-placeholder', 'combo-img-preview-box');
        comboModal.classList.add('active');
    };

    comboForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('combo-id').value;
        const data = {
            name: document.getElementById('combo-name').value,
            description: document.getElementById('combo-desc').value,
            price: document.getElementById('combo-price').value,
            size: document.getElementById('combo-size').value,
            image: document.getElementById('combo-image').value,
            status: document.getElementById('combo-status').value,
            type: 'combo'
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/combos/${id}` : '/api/combos';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        comboModal.classList.remove('active');
        loadCombos();
        Swal.fire({ icon: 'success', title: id ? 'Combo actualizado' : 'Combo guardado', timer: 1500, showConfirmButton: false });
    };

    async function loadCombos() {
        const res = await fetch('/api/combos');
        const combos = await res.json();
        const tbody = document.getElementById('admin-combos-list');
        if (combos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#aaa;">No hay combos registrados</td></tr>';
            return;
        }

        tbody.innerHTML = combos.map(c => `
            <tr data-id="${c.id}">
                <td>
                    <div style="display:flex; align-items:center;">
                        <i class="fas fa-grip-lines drag-handle" style="cursor: grab; color: #ccc; margin-right: 15px; font-size: 1.2rem;" title="Arrastrar para mover"></i>
                        <img src="${c.image}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; margin-right:10px;">
                        <div>
                            <span style="font-weight:700;">${c.name}</span><br>
                            <span style="font-size:0.75rem; color:#888;">${c.description.substring(0, 30)}...</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge" style="background:#f4a261; color:white;">${c.size}</span></td>
                <td style="font-weight:700;">${c.price}</td>
                <td><span class="status-badge status-${c.status}">${c.status === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" title="Editar" onclick='editCombo(${JSON.stringify(c).replace(/'/g, "&#39;")})'><i class="fas fa-edit"></i></button>
                    <button class="btn btn-secondary btn-sm" title="Eliminar" style="color:#c1121f;" onclick="deleteCombo('${c.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        initSortableTable('admin-combos-list', 'combos');
    }

    window.editCombo = (c) => {
        document.getElementById('combo-id').value = c.id;
        document.getElementById('combo-name').value = c.name;
        document.getElementById('combo-desc').value = c.description;
        document.getElementById('combo-price').value = c.price;
        document.getElementById('combo-size').value = c.size;
        document.getElementById('combo-image').value = c.image;
        document.getElementById('combo-status').value = c.status;
        document.getElementById('combo-modal-title').textContent = 'Editar Combo';
        previewImg(c.image, 'combo-img-preview', 'combo-img-placeholder', 'combo-img-preview-box');
        comboModal.classList.add('active');
    };

    window.deleteCombo = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar combo?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c1121f',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar'
        });
        if (result.isConfirmed) {
            await fetch(`/api/combos/${id}`, { method: 'DELETE' });
            loadCombos();
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
        }
    };

    // ─── CARGAR TODO AL INICIO ────────────────────────────────────
    loadDashboard();
    loadMovies();
    loadRooms();
    loadUsers();
    loadTickets();
    loadCombos();
});
