import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const CLIENT_ENV_KEYS = [
  'REACT_APP_APP_ENVIRONMENT',
  'REACT_APP_APP_DEBUG',
  'REACT_APP_PROVIDERS_DEFAULT_PROVIDER',
  'REACT_APP_AGENT_MAX_ITERATIONS',
  'REACT_APP_AGENT_ENABLE_TASK_BREAKDOWN',
  'REACT_APP_AGENT_ENABLE_ITERATION',
  'REACT_APP_AGENT_ENABLE_CONTEXT_MEMORY',
  'REACT_APP_PROMPT_BUILDER_MAX_TOKENS',
  'REACT_APP_PROMPT_BUILDER_TEMPERATURE',
  'REACT_APP_TTS_ENABLED',
  'REACT_APP_MEMORY_DB_ENDPOINT',
  'REACT_APP_MEMORY_COLLECTION_NAME',
  'REACT_APP_LOGGING_LEVEL',
  'REACT_APP_LOGGING_ENABLE_LOCAL_STORAGE',
  'REACT_APP_PUBLIC_URL',
] as const;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'REACT_APP_');
  const mergedEnv = { ...fileEnv, ...process.env };
  const env = Object.fromEntries(
    CLIENT_ENV_KEYS.flatMap((key) => {
      const value = mergedEnv[key];
      return typeof value === 'string' ? [[key, value]] : [];
    })
  ) as Record<string, string>;

  console.log('Loaded public environment variables:');
  Object.entries(env).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  // Get the base URL from environment variables or use '/' as default
  const base = env.REACT_APP_PUBLIC_URL || '/';
  console.log(`Using base URL: ${base}`);

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        "@frontend": path.resolve(import.meta.dirname, "./frontend"),
        "@backend": path.resolve(import.meta.dirname, "./backend"),
        "@shared": path.resolve(import.meta.dirname, "./shared"),
      },
    },
    define: {
      'process.env': JSON.stringify({
        ...env,
        NODE_ENV: mode === 'production' ? 'production' : 'development',
        PUBLIC_URL: base,
      }),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;

            if (
              id.includes('@radix-ui') ||
              id.includes('lucide-react') ||
              id.includes('react-resizable-panels')
            ) {
              return 'ui';
            }

            return 'vendor';
          }
        }
      }
    }
  };
});
