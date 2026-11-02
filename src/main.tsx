import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AppStoreProvider } from '@/store/AppStore';
import { App } from './App';
import './index.css';

// Routing mode:
// - default (BrowserRouter): clean paths; basename matches Vite's `base` so it
//   works at the domain root or a sub-path (GitHub Pages /partsfinderau/).
// - hash (VITE_ROUTER=hash): hash-based routing for a static single-file host
//   (e.g. a self-contained Artifact) where the server can't rewrite paths.
const useHash = import.meta.env.VITE_ROUTER === 'hash';
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const Router = useHash
  ? ({ children }: { children: React.ReactNode }) => <HashRouter>{children}</HashRouter>
  : ({ children }: { children: React.ReactNode }) => <BrowserRouter basename={basename}>{children}</BrowserRouter>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" strips transforms for users who ask for reduced
        motion (keeping gentle opacity) — accessibility handled app-wide. */}
    <MotionConfig reducedMotion="user">
      <Router>
        <AppStoreProvider>
          <App />
        </AppStoreProvider>
      </Router>
    </MotionConfig>
  </StrictMode>,
);
