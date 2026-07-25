import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// 🟢 ลงทะเบียน Service Worker แบบ Inline เพื่อรองรับ PWA Installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `data:text/javascript;base64,${btoa(`
      self.addEventListener('install', (event) => {
        self.skipWaiting();
      });
      self.addEventListener('fetch', (event) => {
        // Simple passthrough for demo environments
        event.respondWith(fetch(event.request));
      });
    `)}`;
    
    navigator.serviceWorker.register(swUrl, { type: 'module' })
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// ดักจับ Error ไม่ให้จอขาวเงียบ
window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100%';
  errorDiv.style.backgroundColor = '#fee2e2';
  errorDiv.style.color = '#dc2626';
  errorDiv.style.padding = '20px';
  errorDiv.style.zIndex = '9999';
  errorDiv.innerHTML = `<strong>System Error:</strong> ${event.message}`;
  document.body.appendChild(errorDiv);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)