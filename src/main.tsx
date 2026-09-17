import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { Checkout } from './components/Checkout';
import { AppProvider } from './context/AppContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      {window.location.pathname.replace(/\/$/, '') === '/checkout' ? <Checkout /> : <App />}
    </AppProvider>
  </StrictMode>,
);

