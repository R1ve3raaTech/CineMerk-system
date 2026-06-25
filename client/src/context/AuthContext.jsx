import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('cinema_user')) || null;
        } catch {
            return null;
        }
    });

    const login = useCallback(async (username, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Credenciales inválidas');
        }
        const user = await res.json();
        localStorage.setItem('cinema_user', JSON.stringify(user));
        setCurrentUser(user);
        return user;
    }, []);

    const register = useCallback(async (userData) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || 'Error al crear cuenta.');
        }
        localStorage.setItem('cinema_user', JSON.stringify(data));
        setCurrentUser(data);
        return data;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('cinema_user');
        setCurrentUser(null);
    }, []);

    const refreshUser = useCallback((user) => {
        localStorage.setItem('cinema_user', JSON.stringify(user));
        setCurrentUser(user);
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
