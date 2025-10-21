import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// (opțional) CSS-urile tale, dacă există:
import './assets/css/core.scss';
import './assets/css/demo.css';
import './assets/css/app-logistics-dashboard.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
