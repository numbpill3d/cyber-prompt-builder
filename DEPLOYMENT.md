# Deployment Guide

## GitHub Pages Deployment

This application is configured for automatic deployment to GitHub Pages.

### Live URL
**Production**: `https://numbpill3d.github.io/cyber-prompt-builder/`

### Automatic Deployment

The application automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

**GitHub Actions Workflow**: `.github/workflows/deploy.yml`

The workflow:
1. Checks out the code
2. Sets up Node.js 18
3. Installs dependencies
4. Builds the application with GitHub Pages configuration
5. Deploys to GitHub Pages

### Configuration

#### Base Path
The application uses `/cyber-prompt-builder/` as the base path for GitHub Pages.

**Configuration files:**
- `.env.production` - Sets `REACT_APP_PUBLIC_URL=/cyber-prompt-builder/`
- `vite.config.ts` - Reads base path from environment
- `src/App.tsx` - Uses basename in BrowserRouter

#### Client-Side Routing
GitHub Pages doesn't natively support client-side routing. This is handled by:

1. **404.html** - Catches all non-root routes and redirects to index.html with route as query param
2. **index.html redirect handler** - Reads the query param and updates browser history
3. **.nojekyll** - Prevents Jekyll from processing files starting with underscore

## Troubleshooting GitHub Pages Blank Page

If you see a blank page:

1. Check browser console for errors
2. Verify `REACT_APP_PUBLIC_URL=/cyber-prompt-builder/` in `.env.production`
3. Ensure basename is set in `src/App.tsx`
4. Rebuild: `npm run build`

The application is now properly configured and will work on GitHub Pages!
