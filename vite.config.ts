import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Load all environment variables with REACT_APP_ prefix
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_');

  // Log loaded environment variables (excluding sensitive ones)
  console.log('Loaded environment variables:');
  Object.keys(env).forEach(key => {
    if (!key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN')) {
      console.log(`  ${key}: ${env[key]}`);
    } else {
      console.log(`  ${key}: [REDACTED]`);
    }
  });

  // Get the base URL from environment variables or use '/' as default
  const base = process.env.PUBLIC_URL || '/';
  console.log(`Using base URL: ${base}`);

  return {
    // Set the base URL for the application
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define environment variables to be replaced in the client code
    define: {
      'process.env': {
        ...env,
        // Ensure PUBLIC_URL is available in the client code
        PUBLIC_URL: JSON.stringify(base)
      }
    },
    // Optimize build
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // Reduce chunk size
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              '@tanstack/react-query'
            ],
            ui: [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-slot',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip'
            ]
          }
        }
      }
    }
  };
});
