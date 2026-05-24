import { StrictMode } from 'react';
import { config } from './config';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.tsx';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={config.googleClientID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);