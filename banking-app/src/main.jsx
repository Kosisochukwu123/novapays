import React, { Suspense, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider }  from './context/AuthContext';
import { AppProvider }   from './context/AppContext';
import SplashScreen      from './components/common/SplashScreen';
import './i18n/index.js';
import './index.css';

const Root = () => {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      <div style={{ opacity: splashDone ? 1 : 0, transition: 'opacity 0.4s ease 0.1s' }}>
        <App />
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <Suspense fallback={null}>
            <Root />
          </Suspense>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
