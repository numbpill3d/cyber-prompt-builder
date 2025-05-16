
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { initializeServices } from './services/initialize-services'
import { errorHandler } from './services/error/error-handler'
import { Logger } from './services/logging/logger'

const logger = new Logger('Main');

// Log environment information
console.log('Application starting...');
console.log('Environment:', process.env.REACT_APP_APP_ENVIRONMENT || 'not set');
console.log('Node Environment:', process.env.NODE_ENV || 'not set');

// Check if we have the root element before trying to initialize services
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found in the DOM');
  document.body.innerHTML = `
    <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
      <h2>Application Error</h2>
      <p>Root element not found. The HTML structure may be incorrect.</p>
    </div>
  `;
} else {
  // Initialize services before rendering the app
  try {
    logger.info('Starting service initialization');

    // Render a loading message while services initialize
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Loading Application...</h2>
        <p>Please wait while the application initializes.</p>
      </div>
    `;

    initializeServices()
      .then(() => {
        logger.info('Services initialized successfully, rendering application');

        // Render the app
        try {
          createRoot(rootElement).render(
            <StrictMode>
              <App />
            </StrictMode>
          );
          logger.info('Application rendered successfully');
        } catch (renderError) {
          console.error('Failed to render application:', renderError);
          errorHandler.handleError(renderError as Error, { context: 'application-render' });

          rootElement.innerHTML = `
            <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
              <h2>Render Error</h2>
              <p>Sorry, there was a problem rendering the application.</p>
              <p>Error: ${renderError instanceof Error ? renderError.message : String(renderError)}</p>
            </div>
          `;
        }
      })
      .catch((error) => {
        // Handle initialization errors
        console.error('Failed to initialize services:', error);
        errorHandler.handleError(error, { context: 'application-startup' });

        // Render error message in the DOM
        rootElement.innerHTML = `
          <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
            <h2>Initialization Error</h2>
            <p>Sorry, there was a problem starting the application. Please try refreshing the page.</p>
            <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
          </div>
        `;
      });
  } catch (error) {
    console.error('Critical error during startup:', error);

    rootElement.innerHTML = `
      <div style="padding: 20px; color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
        <h2>Critical Error</h2>
        <p>A critical error occurred during application startup.</p>
        <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
      </div>
    `;
  }
}
