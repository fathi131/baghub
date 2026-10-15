import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserRoutes from './routes/UserRoutes';
import AdminRoutes from './routes/AdminRoutes';
import { CartProvider } from './context/CartContext'; 

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* User Routes */}
          <Route path="/*" element={<UserRoutes />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;