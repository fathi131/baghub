import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const UserLayout = () => {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      <Navbar />

     
      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>

      
      <Footer />
    </div>
  );
};

export default UserLayout;