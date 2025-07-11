# Deployment Guide

This guide covers deploying the Cyber Prompt Builder to various cloud platforms.

## Quick Deploy Options

### 1. Render (Recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**Steps:**
1. Fork this repository
2. Connect your GitHub account to Render
3. Create a new Web Service
4. Connect your forked repository
5. Use these settings:
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free (or paid for better performance)

**Environment Variables:**
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render default)
- `VITE_OPENAI_API_KEY`: Your OpenAI API key
- `VITE_CLAUDE_API_KEY`: Your Claude API key  
- `VITE_GEMINI_API_KEY`: Your Gemini API key

### 2. Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/deploy)

**Steps:**
1. Click the Railway deploy button
2. Connect your GitHub account
3. Select this repository
4. Railway will auto-detect the configuration from `railway.json`
5. Add environment variables in the Railway dashboard

### 3. Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

**Steps:**
1. Import your repository to Vercel
2. Vercel will auto-detect it's a Vite project
3. Add environment variables
4. Deploy

### 4. Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

**Steps:**
1. Connect your repository to Netlify
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Add environment variables
4. Deploy

## Manual Deployment

### Prerequisites
- Node.js 18+ 
- npm 8+

### Build for Production
```bash
npm ci
npm run build
npm start
```

### Docker Deployment
```bash
# Build image
docker build -t cyber-prompt-builder .

# Run container
docker run -p 3000:3000 \
  -e VITE_OPENAI_API_KEY=your_key \
  -e VITE_CLAUDE_API_KEY=your_key \
  -e VITE_GEMINI_API_KEY=your_key \
  cyber-prompt-builder
```

## Environment Variables

### Required
- `VITE_OPENAI_API_KEY` - OpenAI API key
- `VITE_CLAUDE_API_KEY` - Anthropic Claude API key
- `VITE_GEMINI_API_KEY` - Google Gemini API key

### Optional
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 3000)
- `VITE_APP_NAME` - App name override
- `VITE_APP_VERSION` - App version override

## Platform-Specific Notes

### Render
- Uses `render.yaml` for configuration
- Free tier has 750 hours/month
- Automatic SSL certificates
- Built-in monitoring

### Railway
- Uses `railway.json` for configuration  
- $5/month starter plan
- Automatic deployments from Git
- Built-in databases available

### Vercel
- Optimized for frontend applications
- Generous free tier
- Edge functions support
- Automatic preview deployments

### Netlify
- Great for static sites with serverless functions
- Free tier includes 100GB bandwidth
- Form handling and identity management
- Split testing capabilities

## Troubleshooting

### Build Failures
- Ensure Node.js version is 18+
- Check all dependencies are installed
- Verify environment variables are set

### Runtime Errors
- Check server logs for specific errors
- Verify API keys are valid
- Ensure all required environment variables are set

### Performance Issues
- Consider upgrading to paid plans for better resources
- Enable gzip compression
- Optimize bundle size with tree shaking

## Health Checks

All platforms can use the `/health` endpoint:
```
GET /health
```

Returns:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "version": "1.0.0"
}
```