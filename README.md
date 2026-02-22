# CineMerk - Enterprise Cinema Management System

Sistema Full-Stack de gestión de cines, con panel administrativo integral (CRUD múltiple), motor de venta de entradas con reserva de asientos en tiempo real, integración de monedero digital (E-wallet) nativo, carritos de compras paralelos, y autenticación por roles (Admin/User). Construido con Node.js, Express, Vanilla JavaScript de alto nivel y lógica de API RESTful simulando una base de datos NoSQL mediante JSON.

## Características Principales

*   **Arquitectura Completa:** Servidor backend en Node.js/Express, interactuando con una base de datos en archivos JSON y renderizando un frontend dinámico y reactivo.
*   **Gestión de Estados (State Management):** Carrito de compras global que agrupa la compra de entradas (con selección asíncrona de asientos disponibles mapeados en una cuadrícula virtual) y combos alimenticios con contadores dinámicos.
*   **Monedero Digital (TarjetaMerk):** E-wallet pre-cargada con simulación de transacciones reales, capacidad de saldo restante, protección contra saldos negativos y diseño UI que reacciona a los fondos del usuario.
*   **Simulación Bancaria Replicada:** Sistema de evaluación de pagos mixtos (Billetera Interna vs Tarjetas de Crédito manuales), con algoritmo de probabilidad de aprobación/rechazo al enlazar con "redes bancarias".
*   **Autenticación y Roles Estrictos:** Login y registro persistentes. Sistema dual que aísla por completo la vista "Usuario o Invitado" (compras) de la vista "Administrador" (control interno), evitando intromisiones de seguridad.
*   **Multipantalla Administrador:** 4 paneles integrales de CRUD asíncrono.
    *   *Películas:* Con conversión de imágenes locales a Base64 en el navegador antes del envío.
    *   *Salas:* Control de capacidad estricta y estado operativo (mantenimiento/clausurada).
    *   *Confitería:* Administración de variables infinitas de tamaño, descripción y precio.
    *   *Usuarios/Reportes:* Buscador dinámico de entradas compradas para autorizar accesos o marcar boletos como "Usados".

## Tecnologías Utilizadas
*   **Backend:** Node.js, Express.js
*   **Database:** JSON Files Persistence (NoSQL Style)
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+), Fetch API
*   **UI/UX:** SweetAlert2, CSS Grid/Flexbox, Glassmorphism design patterns, UI Avatars API.

## Cómo ejecutar localmente

1. Clonar el repositorio.
2. Ejecutar `npm install` para instalar las dependencias (Express, CORS, UUID, etc.).
3. Ejecutar `npm start` para levantar el servidor local en el puerto 3000.
4. Entrar desde el navegador a `http://localhost:3000`.

*el usuario de administrador el user: admin_admin y la contraseña es: admin*
