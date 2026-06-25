import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

function readCart(userId) {
    if (!userId) return [];
    try {
        return JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }) {
    const { currentUser } = useAuth();
    const [cart, setCart] = useState(() => readCart(currentUser?.id));

    useEffect(() => {
        setCart(readCart(currentUser?.id));
    }, [currentUser?.id]);

    const persist = useCallback((newCart) => {
        if (!currentUser) return;
        localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(newCart));
        setCart(newCart);
    }, [currentUser]);

    const addToCart = useCallback((item) => {
        if (!currentUser) return false;
        const newCart = [...readCart(currentUser.id), item];
        persist(newCart);
        return true;
    }, [currentUser, persist]);

    const removeFromCart = useCallback((index) => {
        const current = readCart(currentUser?.id);
        const newCart = current.filter((_, i) => i !== index);
        persist(newCart);
    }, [currentUser, persist]);

    const changeComboQty = useCallback((index, delta) => {
        const current = readCart(currentUser?.id);
        const item = current[index];
        if (!item) return;
        const currentQty = item.qty || 1;
        const totalPriceNum = parseInt(item.price.replace(/[^\d]/g, ''));
        const unitPrice = Math.round(totalPriceNum / currentQty);
        const newQty = Math.max(1, Math.min(20, currentQty + delta));
        const newCart = [...current];
        newCart[index] = {
            ...item,
            qty: newQty,
            price: `₡${(unitPrice * newQty).toLocaleString('es-CR')}`
        };
        persist(newCart);
    }, [currentUser, persist]);

    const clearCart = useCallback(() => {
        if (!currentUser) return;
        localStorage.removeItem(`cart_${currentUser.id}`);
        setCart([]);
    }, [currentUser]);

    const refreshCart = useCallback(() => {
        setCart(readCart(currentUser?.id));
    }, [currentUser]);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, changeComboQty, clearCart, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
