import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AdminPanel } from './components/admin/AdminPanel';
import './index.css';

/*
 * /admin ayrı bir kök: oyun uygulamasının soketleri, hub'ı ve başlık çubuğu
 * yönetim ekranında hiç çalışmasın. Vercel tüm yolları index.html'e yönlendiriyor,
 * bu yüzden ayrım yol üzerinden burada yapılıyor.
 */
const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? <AdminPanel /> : <App />}
  </StrictMode>,
);
