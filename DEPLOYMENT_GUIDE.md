# Deployment Guide - Cyber Prompt Builder

This comprehensive guide covers all deployment options for the Cyber Prompt Builder application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Firebase Deployment](#firebase-deployment)
4. [GitHub Pages Deployment](#github-pages-deployment)
5. [Other Deployment Options](#other-deployment-options)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control

### API Keys
At least one AI provider API key is required:
- **Google Gemini** (Recommended for free tier): [Get API Key](https://makersuite.google.com/app/apikey)
- **OpenAI**: [Get API Key](https://platform.openai.com/api-keys)
- **Anthropic Claude**: [Get API Key](https://console.anthropic.com/)

---

## Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/numbpill3d/cyber-prompt-builder.git
cd cyber-prompt-builder
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# Application Configuration
REACT_APP_APP_ENVIRONMENT=development
REACT_APP_APP_DEBUG=true

# AI Provider API Keys (at least one required)
REACT_APP_PROVIDERS_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_PROVIDERS_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_PROVIDERS_CLAUDE_API_KEY=your_claude_api_key_here

# Optional Configuration
REACT_APP_PROVIDERS_DEFAULT_PROVIDER=gemini
REACT_APP_AGENT_MAX_ITERATIONS=3
REACT_APP_PROMPT_BUILDER_MAX_TOKENS=4096
REACT_APP_PROMPT_BUILDER_TEMPERATURE=0.7
REACT_APP_PUBLIC_URL=/
```

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### 5. Build for Production
```bash
npm run build
```

The production build will be created in the `dist` directory.

---

## Firebase Deployment

Firebase Hosting is the **recommended deployment method** for this application. It provides:
- Free SSL certificates
- Global CDN
- Easy custom domain setup
- Excellent performance
- Simple rollback capabilities

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "cyber-prompt-builder")
4. Follow the setup wizard
5. Once created, note your project ID

### Step 4: Update Firebase Configuration

Edit `.firebaserc` and replace `your-firebase-project-id` with your actual project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### Step 5: Configure Environment Variables

You have two options for setting environment variables:

#### Option A: Local .env File (For Build Time)
Create `.env.production` file:

```env
REACT_APP_APP_ENVIRONMENT=production
REACT_APP_PROVIDERS_GEMINI_API_KEY=your_gemini_api_key
REACT_APP_PROVIDERS_OPENAI_API_KEY=your_openai_api_key
REACT_APP_PROVIDERS_CLAUDE_API_KEY=your_claude_api_key
REACT_APP_PROVIDERS_DEFAULT_PROVIDER=gemini
REACT_APP_PUBLIC_URL=/
```

#### Option B: Firebase Environment Config (Recommended)
```bash
firebase functions:config:set \
  app.environment="production" \
  providers.gemini_api_key="your_key" \
  providers.openai_api_key="your_key" \
  providers.claude_api_key="your_key"
```

### Step 6: Build the Application

```bash
npm run build
```

### Step 7: Deploy to Firebase

```bash
firebase deploy
```

Your application will be deployed to:
```
https://your-project-id.web.app
https://your-project-id.firebaseapp.com
```

### Step 8: Set Up Custom Domain (Optional)

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the instructions to verify domain ownership
4. Add the required DNS records
5. Wait for SSL certificate provisioning (usually 24 hours)

### Updating Your Deployment

To deploy updates:

```bash
# 1. Make your changes
# 2. Build the application
npm run build

# 3. Deploy
firebase deploy
```

### Firebase Deployment Tips

- **Environment Variables**: Never commit `.env.production` with real API keys to Git
- **Rollback**: Use `firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL TARGET_SITE_ID:live` to rollback
- **Preview**: Use `firebase hosting:channel:deploy preview` for preview deployments
- **Monitoring**: Check Firebase Console → Hosting for usage statistics

---

## GitHub Pages Deployment

GitHub Pages provides free hosting directly from your GitHub repository.

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Source", select **GitHub Actions**

### Step 2: Configure Repository Settings

The `.github/workflows/deploy-github-pages.yml` file is already configured. It will:
- Build the application on every push to `main`
- Deploy to GitHub Pages automatically
- Handle SPA routing with 404.html fallback

### Step 3: Update vite.config.ts (If needed)

If your repository name is not `cyber-prompt-builder`, update the base URL in `.github/workflows/deploy-github-pages.yml`:

```yaml
- name: Build application
  run: npm run build
  env:
    REACT_APP_APP_ENVIRONMENT: production
    REACT_APP_PUBLIC_URL: /your-repo-name  # Change this
```

### Step 4: Configure Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

```
REACT_APP_PROVIDERS_GEMINI_API_KEY
REACT_APP_PROVIDERS_OPENAI_API_KEY
REACT_APP_PROVIDERS_CLAUDE_API_KEY
```

**⚠️ Security Note**: Be cautious about exposing API keys in client-side applications. Consider implementing a backend proxy for production use.

### Step 5: Push to GitHub

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

The GitHub Action will automatically build and deploy your application.

### Step 6: Access Your Application

Your application will be available at:
```
https://your-username.github.io/cyber-prompt-builder/
```

### GitHub Pages Troubleshooting

**Blank Page Issues:**
- Check that `REACT_APP_PUBLIC_URL` matches your repository name
- Ensure the workflow completed successfully in the Actions tab
- Check browser console for 404 errors on assets

**Routing Issues:**
- The app uses `404.html` for SPA routing (already configured)
- Deep links should work after the workflow completes

**Build Failures:**
- Check the Actions tab for error messages
- Verify all dependencies are in `package.json`
- Ensure Node.js version matches (18.x)

---

## Other Deployment Options

### Netlify

1. **Connect Repository:**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

2. **Configure Build Settings:**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Add Environment Variables:**
   - Go to Site settings → Environment variables
   - Add your API keys and configuration

4. **Deploy:**
   - Netlify will automatically deploy on every push to main

**Configuration file** (`netlify.toml` already included):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Configure Environment Variables:**
   ```bash
   vercel env add REACT_APP_PROVIDERS_GEMINI_API_KEY
   ```

**Configuration file** (`vercel.json` already included):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Railway

1. **Create New Project:**
   - Go to [Railway](https://railway.app/)
   - Create a new project from GitHub repo

2. **Configure:**
   - Railway will auto-detect the Dockerfile
   - Add environment variables in the Variables tab

3. **Deploy:**
   - Automatic deployments on every push

**Configuration file** (`railway.json` already included).

### Render

1. **Create Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - New → Web Service
   - Connect your repository

2. **Configure:**
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Add Environment Variables:**
   - Add your API keys in the Environment tab

**Configuration file** (`render.yaml` already included).

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_APP_ENVIRONMENT` | Application environment | `production` |
| `REACT_APP_PROVIDERS_*_API_KEY` | At least one AI provider API key | Your API key |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_PROVIDERS_DEFAULT_PROVIDER` | Default AI provider | `gemini` |
| `REACT_APP_AGENT_MAX_ITERATIONS` | Max agent iterations | `3` |
| `REACT_APP_PROMPT_BUILDER_MAX_TOKENS` | Max tokens for prompts | `4096` |
| `REACT_APP_PROMPT_BUILDER_TEMPERATURE` | AI temperature setting | `0.7` |
| `REACT_APP_PUBLIC_URL` | Base URL for routing | `/` |
| `REACT_APP_APP_DEBUG` | Enable debug logging | `false` |

---

## Security Best Practices

### API Key Security

**⚠️ Important**: This is a client-side application, which means API keys are exposed in the browser.

**For Production:**
1. **Implement a Backend Proxy**: Create a backend service that:
   - Stores API keys securely
   - Validates requests
   - Forwards requests to AI providers
   - Implements rate limiting

2. **Use Environment-Specific Keys**: Use different API keys for development and production

3. **Implement Usage Limits**: Set up usage limits in your AI provider dashboards

4. **Monitor Usage**: Regularly check your API usage and costs

### Example Backend Proxy (Node.js/Express)

```javascript
// server.js
const express = require('express');
const app = express();

app.post('/api/generate', async (req, res) => {
  // Validate request
  // Forward to AI provider with server-side API key
  // Return response
});

app.listen(3000);
```

---

## Testing Your Deployment

### 1. Local Testing

```bash
# Build for production
npm run build

# Test with local server
npm start

# Or use a simple HTTP server
npx serve dist
```

### 2. Smoke Testing Checklist

After deployment, verify:

- [ ] Application loads without errors
- [ ] All pages are accessible (Home, Settings, Prompt Builder, etc.)
- [ ] Navigation works correctly
- [ ] API key configuration works
- [ ] AI code generation works
- [ ] Dark theme renders correctly
- [ ] Responsive design works on mobile
- [ ] Browser console has no errors
- [ ] All assets load (images, fonts, etc.)

### 3. Performance Testing

```bash
# Run Lighthouse audit
npx lighthouse https://your-app-url.com
```

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## Troubleshooting

### Build Errors

**Error: "vite: not found"**
```bash
# Solution: Install dependencies
npm install
```

**Error: "ENOENT: no such file or directory"**
```bash
# Solution: Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Runtime Errors

**Error: "Failed to initialize services"**
- Check browser console for specific error
- Verify API keys are set correctly
- Check network tab for failed requests

**Error: "Blank page after deployment"**
- Check `REACT_APP_PUBLIC_URL` matches deployment path
- Verify base name in App.tsx
- Check browser console for errors

### Deployment Errors

**Firebase: "Permission denied"**
```bash
# Solution: Re-authenticate
firebase logout
firebase login
```

**GitHub Pages: "404 on assets"**
- Verify `REACT_APP_PUBLIC_URL` is set correctly in workflow
- Check that workflow completed successfully

---

## Monitoring and Maintenance

### Firebase

- **Analytics**: Enable Firebase Analytics for user tracking
- **Performance**: Use Firebase Performance Monitoring
- **Error Tracking**: Set up Firebase Crashlytics

### GitHub Pages

- **Usage**: Check repository Insights → Traffic
- **Actions**: Monitor workflow runs in Actions tab

### General

- **Uptime Monitoring**: Use services like UptimeRobot or Pingdom
- **Error Tracking**: Integrate Sentry or similar service
- **Analytics**: Add Google Analytics or Plausible

---

## Support and Resources

### Documentation
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [GitHub Pages](https://pages.github.com/)

### AI Provider Documentation
- [Google Gemini API](https://ai.google.dev/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)

### Community
- [Project Issues](https://github.com/numbpill3d/cyber-prompt-builder/issues)
- [Discussions](https://github.com/numbpill3d/cyber-prompt-builder/discussions)

---

## Quick Start Summary

### For Firebase (Recommended):
```bash
npm install
npm run build
firebase login
# Edit .firebaserc with your project ID
firebase deploy
```

### For GitHub Pages:
```bash
# 1. Enable GitHub Pages in repository settings
# 2. Add API keys as repository secrets
# 3. Push to main branch
git push origin main
```

### For Local Development:
```bash
npm install
# Create .env.local with your API keys
npm run dev
```

---

## License

MIT License - See LICENSE file for details
