import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { initializeServices } from '@backend/services/initialize-services'
import { errorHandler } from '@backend/services/error/error-handler'
import { Logger } from '@shared/services/logging/logger'

const logger = new Logger('Main');

// Initialize services before rendering the app
initializeServices()
  .then(() => {
    logger.info('Services initialized, rendering application');
    
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      throw new Error('Root element not found');
    }

    // Render the app
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((error) => {
    // Handle initialization errors
    console.error('Failed to initialize services:', error);
    errorHandler.handleError(error, { context: 'application-startup' });
    
    // Render error message in the DOM
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
          <h2>Application Error</h2>
          <p>Sorry, there was a problem starting the application. Please try refreshing the page.</p>
          <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
        </div>
      `;
    }
  });
