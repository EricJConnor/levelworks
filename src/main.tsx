import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './contexts/DataContext';
import { InvoiceProvider } from './contexts/InvoiceContext';

// Service worker is registered in index.html - don't duplicate here

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <InvoiceProvider>
        <App />
      </InvoiceProvider>
    </DataProvider>
  </StrictMode>,
);
