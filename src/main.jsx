import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/styles.css';
import './styles/sprint64d.css';
import './styles/sprint64d-account-admin.css';
import './styles/sprint64e.css';
import './styles/sprint64f.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
