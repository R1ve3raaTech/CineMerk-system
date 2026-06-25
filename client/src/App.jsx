import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import MovieDetail from './pages/MovieDetail';
import ProductDetail from './pages/ProductDetail';
import Combos from './pages/Combos';
import Purchases from './pages/Purchases';
import Payments from './pages/Payments';

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/movie/:id" element={<MovieDetail />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/combos" element={<Combos />} />
                    <Route path="/purchases" element={<Purchases />} />
                    <Route path="/payments" element={<Payments />} />
                </Routes>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
