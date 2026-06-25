const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const CLIENT_DIST = path.join(__dirname, '../client/dist');
app.use(express.static(CLIENT_DIST));

const MOVIES_FILE = path.join(__dirname, '../data/movies.json');
const ROOMS_FILE = path.join(__dirname, '../data/rooms.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const TICKETS_FILE = path.join(__dirname, '../data/tickets.json');
const COMBOS_FILE = path.join(__dirname, '../data/combos.json');
const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

// Ensure data directory and files exist
if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'));
}

const initializeFile = (file, initialData) => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(initialData, null, 2));
    }
};

initializeFile(MOVIES_FILE, []);
initializeFile(ROOMS_FILE, []);
initializeFile(USERS_FILE, []);
initializeFile(TICKETS_FILE, []);
initializeFile(ORDERS_FILE, []);
initializeFile(COMBOS_FILE, [
    {
        id: uuidv4(),
        name: "Combo VIP Diamond",
        description: "2 Palomitas XL + 2 Refrescos Grandes + 2 Hot Dogs Premium + Chocolates Ferrero + Sofá Reservado",
        price: "₡28500",
        size: "Élite",
        type: "combo",
        image: "https://images.unsplash.com/photo-1585647347456-4773f7f508a1?q=80&w=500&auto=format&fit=crop",
        status: "activo"
    },
    {
        id: uuidv4(),
        name: "Combo Pareja Premium",
        description: "2 palomitas grandes + 2 bebidas medianas + 2 postres gourmet",
        price: "₡15900",
        size: "Grande",
        type: "combo",
        image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=500&auto=format&fit=crop",
        status: "activo"
    },
    {
        id: uuidv4(),
        name: "Combo Familiar XL",
        description: "4 palomitas medianas + 4 bebidas + 2 nachos + 2 hot dogs",
        price: "₡22500",
        size: "Familiar",
        type: "combo",
        image: "https://images.unsplash.com/photo-1513456852971-30c0b81c9d2c?q=80&w=500&auto=format&fit=crop",
        status: "activo"
    },
    {
        id: uuidv4(),
        name: "Combo Kids Mágico",
        description: "Palomitas pequeñas + Jugo Natural + Juguete Coleccionable + Kinder Sorpresa",
        price: "₡7200",
        size: "Pequeño",
        type: "combo",
        image: "https://images.unsplash.com/photo-1594433766904-46966144e78d?q=80&w=500&auto=format&fit=crop",
        status: "activo"
    },
    {
        id: uuidv4(),
        name: "Hamburguesa Angus Gold",
        description: "Carne Angus 250g, queso brie, cebolla caramelizada y papas trufadas",
        price: "₡9500",
        size: "Premium",
        type: "individual",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop",
        status: "activo"
    },
    {
        id: uuidv4(),
        name: "Tabla de Quesos & Vino",
        description: "Selección de quesos europeos, carnes frías y una copa de vino tinto",
        price: "₡18000",
        size: "Gourmet",
        type: "individual",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=500&auto=format&fit=crop",
        status: "activo"
    },
    {
        id: uuidv4(),
        name: "Milkshake Oreo Deluxe",
        description: "Malteada cremosa con trozos de Oreo, crema batida y sirope de chocolate",
        price: "₡4800",
        size: "Grande",
        type: "individual",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=500&auto=format&fit=crop",
        status: "activo"
    },
    {
        id: uuidv4(),
        name: "Nachos Supreme",
        description: "Extra queso, Chili con carne, jalapeños y guacamole fresco",
        price: "₡8500",
        size: "Extragrande",
        type: "individual",
        image: "https://images.unsplash.com/photo-1513456852971-30c0b81c9d2c?q=80&w=500&auto=format&fit=crop",
        status: "activo"
    }
]);

const readData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- Drag and Drop Reorder Endpoints ---
const handleReorder = (fileKey, req, res) => {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ error: 'Invalid order array' });
    let data = readData(fileKey);
    const newData = [];
    order.forEach(id => {
        const item = data.find(i => i.id === id);
        if (item) newData.push(item);
    });
    data.forEach(item => {
        if (!order.includes(item.id)) newData.push(item);
    });
    writeData(fileKey, newData);
    res.json(newData);
};

app.put('/api/rooms/reorder', (req, res) => handleReorder(ROOMS_FILE, req, res));
app.put('/api/movies/reorder', (req, res) => handleReorder(MOVIES_FILE, req, res));
app.put('/api/combos/reorder', (req, res) => handleReorder(COMBOS_FILE, req, res));

// Movies CRUD
app.get('/api/movies', (req, res) => {
    res.json(readData(MOVIES_FILE));
});

app.post('/api/movies', (req, res) => {
    const movies = readData(MOVIES_FILE);
    const newMovie = { ...req.body, id: uuidv4() };
    movies.push(newMovie);
    writeData(MOVIES_FILE, movies);
    res.status(201).json(newMovie);
});

app.put('/api/movies/:id', (req, res) => {
    const movies = readData(MOVIES_FILE);
    const index = movies.findIndex(m => m.id === req.params.id);
    if (index !== -1) {
        movies[index] = { ...req.body, id: req.params.id };
        writeData(MOVIES_FILE, movies);
        res.json(movies[index]);
    } else {
        res.status(404).json({ message: 'Movie not found' });
    }
});

app.delete('/api/movies/:id', (req, res) => {
    let movies = readData(MOVIES_FILE);
    movies = movies.filter(m => m.id !== req.params.id);
    writeData(MOVIES_FILE, movies);
    res.status(204).send();
});

// Rooms CRUD
app.get('/api/rooms', (req, res) => {
    res.json(readData(ROOMS_FILE));
});

app.post('/api/rooms', (req, res) => {
    const rooms = readData(ROOMS_FILE);
    const newRoom = { ...req.body, id: uuidv4() };
    rooms.push(newRoom);
    writeData(ROOMS_FILE, rooms);
    res.status(201).json(newRoom);
});

app.put('/api/rooms/:id', (req, res) => {
    const rooms = readData(ROOMS_FILE);
    const index = rooms.findIndex(r => r.id === req.params.id);
    if (index !== -1) {
        rooms[index] = { ...req.body, id: req.params.id };
        writeData(ROOMS_FILE, rooms);
        res.json(rooms[index]);
    } else {
        res.status(404).json({ message: 'Room not found' });
    }
});

app.delete('/api/rooms/:id', (req, res) => {
    let rooms = readData(ROOMS_FILE);
    rooms = rooms.filter(r => r.id !== req.params.id);
    writeData(ROOMS_FILE, rooms);
    res.status(204).send();
});

// --- Auth & Users ---
app.post('/api/auth/register', (req, res) => {
    const users = readData(USERS_FILE);
    const { username, password, firstName, lastName, phone, email, idType, idCard, birthDate } = req.body;

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const newUser = {
        id: uuidv4(),
        username,
        password,
        firstName,
        lastName,
        phone,
        email,
        idType: idType || 'fisica',
        idCard,
        birthDate,
        role: username === 'admin_admin' ? 'admin' : 'user',
        tarjetaMerk: {
            number: 'MERK-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            balance: 50000,
            createdAt: new Date().toISOString()
        }
    };

    users.push(newUser);
    writeData(USERS_FILE, users);
    res.status(201).json(newUser);
});

app.post('/api/auth/login', (req, res) => {
    const users = readData(USERS_FILE);
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json(user);
    } else {
        res.status(401).json({ message: 'Credenciales inválidas' });
    }
});

app.get('/api/users', (req, res) => {
    const users = readData(USERS_FILE);
    const safeUsers = users.map(({ password, ...u }) => u);
    res.json(safeUsers);
});

// --- Combos Endpoints ---
app.get('/api/combos', (req, res) => {
    res.json(readData(COMBOS_FILE));
});

app.post('/api/combos', (req, res) => {
    const combos = readData(COMBOS_FILE);
    const newCombo = { ...req.body, id: uuidv4() };
    combos.push(newCombo);
    writeData(COMBOS_FILE, combos);
    res.status(201).json(newCombo);
});

app.put('/api/combos/:id', (req, res) => {
    const combos = readData(COMBOS_FILE);
    const index = combos.findIndex(c => c.id === req.params.id);
    if (index !== -1) {
        combos[index] = { ...req.body, id: req.params.id };
        writeData(COMBOS_FILE, combos);
        res.json(combos[index]);
    } else {
        res.status(404).send();
    }
});

app.delete('/api/combos/:id', (req, res) => {
    let combos = readData(COMBOS_FILE);
    combos = combos.filter(c => c.id !== req.params.id);
    writeData(COMBOS_FILE, combos);
    res.status(204).send();
});

// --- Tickets Endpoints ---
app.post('/api/tickets/purchase', (req, res) => {
    const { userId, username, movieId, movieTitle, roomName, price, seats, time, qty } = req.body;
    const tickets = readData(TICKETS_FILE);

    const newTicket = {
        id: uuidv4(),
        userId,
        username: username || 'unknown',
        movieId,
        movieTitle,
        roomName,
        price,
        seats, // Array of seats like ["A1", "A2"]
        time,
        qty: qty || seats.length,
        date: new Date().toISOString(),
        status: 'active' // active, used, expired
    };

    tickets.push(newTicket);
    writeData(TICKETS_FILE, tickets);
    res.status(201).json(newTicket);
});

// Endpoint specifically to check occupied seats
app.get('/api/tickets/occupied/:movieId/:time/:roomName', (req, res) => {
    const { movieId, time, roomName } = req.params;
    const tickets = readData(TICKETS_FILE);

    // Filter active tickets for this specific showtime
    const occupied = tickets
        .filter(t => t.movieId === movieId && t.time === time && t.roomName === roomName && t.status === 'active')
        .reduce((acc, t) => acc.concat(t.seats || []), []);

    res.json(occupied);
});

// GET all tickets (admin only)
app.get('/api/tickets/all', (req, res) => {
    const tickets = readData(TICKETS_FILE);
    res.json(tickets);
});

app.get('/api/tickets/user/:userId', (req, res) => {
    const tickets = readData(TICKETS_FILE);
    const userId = req.params.userId;
    const isAdmin = req.query.isAdmin === 'true';

    // If admin param or 'all' userId, show all. If user, show only theirs.
    const filtered = (isAdmin || userId === 'all') ? tickets : tickets.filter(t => t.userId === userId);
    res.json(filtered);
});

app.delete('/api/tickets/:id', (req, res) => {
    let tickets = readData(TICKETS_FILE);
    tickets = tickets.filter(t => t.id !== req.params.id);
    writeData(TICKETS_FILE, tickets);
    res.json({ message: 'Ticket eliminado' });
});

app.patch('/api/tickets/:id/use', (req, res) => {
    const tickets = readData(TICKETS_FILE);
    const index = tickets.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
        // Allow status to be set from body, fallback to 'used'
        tickets[index].status = req.body.status || 'used';
        writeData(TICKETS_FILE, tickets);
        res.json(tickets[index]);
    } else {
        res.status(404).send();
    }
});

app.get('/api/users/:id', (req, res) => {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.params.id);
    if (user) {
        const { password, ...safeUser } = user;
        res.json(safeUser);
    } else {
        res.status(404).send();
    }
});

app.delete('/api/users/:id', (req, res) => {
    let users = readData(USERS_FILE);
    const userToDelete = users.find(u => u.id === req.params.id);

    if (userToDelete?.username === 'admin_admin') {
        return res.status(403).json({ message: 'No se puede eliminar al administrador principal' });
    }

    users = users.filter(u => u.id !== req.params.id);
    writeData(USERS_FILE, users);
    res.json({ message: 'Usuario eliminado' });
});

app.patch('/api/users/:id/role', (req, res) => {
    const users = readData(USERS_FILE);
    const { role } = req.body;
    const index = users.findIndex(u => u.id === req.params.id);

    if (index !== -1) {
        if (users[index].username === 'admin_admin') {
            return res.status(403).json({ message: 'No se puede cambiar el rol del administrador principal' });
        }
        users[index].role = role;
        writeData(USERS_FILE, users);
        res.json(users[index]);
    } else {
        res.status(404).send();
    }
});

// ─── TARJETA MERK ────────────────────────────────────────────────
// GET saldo TarjetaMerk
app.get('/api/users/:id/tarjeta', (req, res) => {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user.tarjetaMerk || null);
});

// PATCH descontar/actualizar saldo
app.patch('/api/users/:id/tarjeta', (req, res) => {
    const users = readData(USERS_FILE);
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Usuario no encontrado' });

    const { amount } = req.body; // amount negativo = descuento, positivo = recarga
    if (!users[index].tarjetaMerk) {
        return res.status(400).json({ message: 'Usuario sin TarjetaMerk' });
    }
    const newBalance = users[index].tarjetaMerk.balance + amount;
    if (newBalance < 0) {
        return res.status(400).json({ message: 'Saldo insuficiente en TarjetaMerk', balance: users[index].tarjetaMerk.balance });
    }
    users[index].tarjetaMerk.balance = newBalance;
    writeData(USERS_FILE, users);
    res.json({ balance: newBalance, tarjetaMerk: users[index].tarjetaMerk });
});

// ─── ORDERS (BOLSAS DE COMPRA) ───────────────────────────────────
// GET todas las órdenes (admin)
app.get('/api/orders/all', (req, res) => {
    res.json(readData(ORDERS_FILE));
});

// GET órdenes de un usuario
app.get('/api/orders/user/:userId', (req, res) => {
    const orders = readData(ORDERS_FILE);
    res.json(orders.filter(o => o.userId === req.params.userId));
});

// POST crear nueva orden agrupada
app.post('/api/orders', (req, res) => {
    const { userId, username, items, total, paymentMethod } = req.body;
    if (!userId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Datos de orden incompletos' });
    }
    const orders = readData(ORDERS_FILE);
    const newOrder = {
        id: uuidv4(),
        orderId: 'ORD-' + Date.now().toString(36).toUpperCase(),
        userId,
        username: username || 'unknown',
        items,           // array de todos los items del carrito
        total,           // total en número
        paymentMethod: paymentMethod || 'TarjetaMerk',
        date: new Date().toISOString(),
        status: 'completed'
    };
    orders.push(newOrder);
    writeData(ORDERS_FILE, orders);

    // También guardar tickets individuales para el selector de asientos
    const tickets = readData(TICKETS_FILE);
    items.filter(i => i.type === 'entrada').forEach(ticket => {
        tickets.push({
            id: uuidv4(),
            orderId: newOrder.id,
            userId,
            username: username || 'unknown',
            movieId: ticket.movieId,
            movieTitle: ticket.movieTitle,
            roomName: ticket.roomName,
            price: ticket.price,
            seats: ticket.seats || [],
            time: ticket.time,
            qty: ticket.qty || 1,
            type: 'entrada',
            date: newOrder.date,
            status: 'active'
        });
    });
    writeData(TICKETS_FILE, tickets);

    res.status(201).json(newOrder);
});

// DELETE orden
app.delete('/api/orders/:id', (req, res) => {
    let orders = readData(ORDERS_FILE);
    orders = orders.filter(o => o.id !== req.params.id);
    writeData(ORDERS_FILE, orders);
    res.json({ message: 'Orden eliminada' });
});

// SPA fallback: serve client/dist/index.html for any non-API route
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile('index.html', { root: CLIENT_DIST });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
