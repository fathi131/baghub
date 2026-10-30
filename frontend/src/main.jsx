import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './App.css';  
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { prepareFacebookSdk } from './services/socialAuth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (import.meta.env.VITE_FACEBOOK_APP_ID) {
  prepareFacebookSdk().catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId || ""}>
      <App />
      <ToastContainer position ="top-right" autoClose={3000} />
    </GoogleOAuthProvider>
  </React.StrictMode>
);