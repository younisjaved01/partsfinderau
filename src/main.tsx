import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AppStoreProvider } from '@/store/AppStore';
import { App } from './App';
import './index.css';

// Router basename must match Vite's `base` so the app works whether it's
// served from the domain root (Vercel/Netlify/dev) or a sub-path
// (GitHub Pages project site, /partsfinderau/).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" strips transforms for users who ask for reduced
        motion (keeping gentle opacity) — accessibility handled app-wide. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter basename={basename}>
        <AppStoreProvider>
          <App />
        </AppStoreProvider>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
);
