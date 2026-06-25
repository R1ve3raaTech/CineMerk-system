import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { requireLogin } from './checkout';

export function useAddToCart() {
    const { currentUser } = useAuth();
    const cartCtx = useCart();
    const navigate = useNavigate();

    return (item) => {
        if (!currentUser) {
            requireLogin(navigate);
            return;
        }

        if (item.type === 'entrada' && !item.seats) {
            navigate(`/movie/${item.movieId}`);
            return;
        }

        cartCtx.addToCart(item);

        Swal.fire({
            title: '¡Añadido!',
            text: `${item.name || item.movieTitle} se agregó al carrito`,
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    };
}
