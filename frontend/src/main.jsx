import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './App.css';  
import { GoogleOAuthProvider } from '@react-oauth/google';
import { prepareFacebookSdk } from './services/socialAuth';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (import.meta.env.VITE_FACEBOOK_APP_ID) {
  prepareFacebookSdk().catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId || ""}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);