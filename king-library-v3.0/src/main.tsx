import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initFirebase } from './services/firebase';
import { initAuth } from './services/auth';
import { ErrorBoundary } from './components/ErrorBoundary';

function Root() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/firebase-applet-config.json');
        if (response.ok) {
          const config = await response.json();
          initFirebase(config);
          initAuth(config);
          console.log("Firebase initialized");
        }
      } catch (error) {
        console.error("Failed to load Firebase config:", error);
      } finally {
        setIsReady(true);
      }
    };
    loadConfig();
  }, []);

  if (!isReady) return null;

  return (
    <ErrorBoundary>
      <StrictMode>
        <App />
      </StrictMode>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
