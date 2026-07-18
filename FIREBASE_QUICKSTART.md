# Firebase Deployment - Quick Start Guide

Get your Cyber Prompt Builder app deployed to Firebase in under 5 minutes!

## Prerequisites
- Node.js 18+ installed
- A Google account
- At least one AI provider API key

## Step-by-Step Deployment

### 1. Install Firebase CLI (One-time setup)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```
This will open your browser for authentication.

### 3. Create a Firebase Project

#### Option A: Via Web Console (Easier)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `cyber-prompt-builder` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"
6. **Copy your Project ID** (you'll need it next)

#### Option B: Via CLI
```bash
firebase projects:create cyber-prompt-builder
```

### 4. Update Firebase Configuration

Edit `.firebaserc` file and replace the project ID:
```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID_HERE"
  }
}
```

### 5. Configure Environment Variables

Create a `.env.production` file:
```env
REACT_APP_APP_ENVIRONMENT=production
REACT_APP_APP_DEBUG=false

# Add at least one API key
REACT_APP_PROVIDERS_GEMINI_API_KEY=your_gemini_key_here
REACT_APP_PROVIDERS_OPENAI_API_KEY=your_openai_key_here
REACT_APP_PROVIDERS_CLAUDE_API_KEY=your_claude_key_here

# Optional: Set your preferred default provider
REACT_APP_PROVIDERS_DEFAULT_PROVIDER=gemini
REACT_APP_PUBLIC_URL=/
```

**🔑 Get Free API Keys:**
- **Gemini (Recommended)**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys
- **Claude**: https://console.anthropic.com/

### 6. Install Dependencies
```bash
npm install
```

### 7. Build the Application
```bash
npm run build
```

You should see output like:
```
✓ built in 8.95s
✅ Build output check completed successfully
```

### 8. Deploy to Firebase! 🚀
```bash
firebase deploy
```

This will:
- Upload your app to Firebase Hosting
- Configure SSL certificates
- Set up CDN distribution
- Give you live URLs

### 9. Access Your App

After deployment completes, you'll see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT_ID/overview
Hosting URL: https://YOUR_PROJECT_ID.web.app
```

**Your app is now live!** 🎉

Visit the Hosting URL to see your deployed application.

---

## Quick Commands Reference

```bash
# Deploy
firebase deploy

# Deploy only hosting (faster)
firebase deploy --only hosting

# Preview before deploying
firebase hosting:channel:deploy preview

# View deployment logs
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback

# Open Firebase console
firebase open hosting
```

---

## Setting Up a Custom Domain

### 1. Add Domain in Firebase Console
```bash
firebase open hosting
```
Or go to: https://console.firebase.google.com/project/YOUR_PROJECT_ID/hosting

### 2. Click "Add custom domain"

### 3. Enter your domain name
Example: `myapp.com` or `app.mydomain.com`

### 4. Verify domain ownership
Add a TXT record to your DNS:
```
Host: @
Type: TXT
Value: [provided by Firebase]
```

### 5. Add DNS A records
Once verified, add these A records:
```
Host: @
Type: A
Value: [provided by Firebase - usually 2 IP addresses]
```

For subdomains (like `app.mydomain.com`):
```
Host: app
Type: CNAME
Value: YOUR_PROJECT_ID.web.app
```

### 6. Wait for SSL Certificate
- DNS propagation: 1-24 hours
- SSL certificate: automatic after DNS propagates

---

## Updating Your Deployed App

When you make changes:

```bash
# 1. Test locally
npm run dev

# 2. Build for production
npm run build

# 3. Deploy
firebase deploy
```

That's it! Your changes are live.

---

## Troubleshooting

### Error: "Permission denied"
```bash
firebase logout
firebase login
firebase deploy
```

### Error: "Project not found"
Check that `.firebaserc` has the correct project ID:
```bash
firebase projects:list
```

### Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### App shows blank page
1. Check browser console for errors
2. Verify API keys are set in `.env.production`
3. Try clearing browser cache

---

## Environment Management

### Development
```bash
npm run dev
# Uses .env.local or .env.development
```

### Production Build
```bash
npm run build
# Uses .env.production
```

### Testing Production Build Locally
```bash
npm run build
npm run preview
# Or: npx serve dist
```

---

## Security Tips

🔒 **API Key Security:**
- Never commit `.env.production` with real keys to Git
- Consider implementing a backend proxy for production
- Set usage limits in your AI provider dashboards
- Monitor usage regularly

🔒 **Firebase Security:**
- Enable Firebase App Check for abuse prevention
- Set up Firebase Security Rules if using Firestore/Storage
- Monitor usage in Firebase Console

---

## Cost Management

### Firebase Hosting (Free Tier)
- 10 GB storage
- 360 MB/day bandwidth
- Custom domain support
- SSL certificates included

**Typical small app usage:** Well within free tier!

### AI Provider Costs
- **Gemini**: Generous free tier
- **OpenAI**: Pay per token
- **Claude**: Pay per token

💡 **Pro tip**: Start with Gemini for testing - it has the best free tier.

---

## Monitoring Your App

### Firebase Console
```bash
firebase open hosting
```

View:
- Traffic and bandwidth usage
- Request count
- Error rates
- Performance metrics

### Enable Firebase Analytics
1. Go to Firebase Console
2. Enable Analytics
3. Add analytics configuration to your app
4. Track user interactions

---

## Next Steps

✅ **You're deployed! Now consider:**

1. **Set up a custom domain** (Optional)
2. **Enable Firebase Analytics** for user insights
3. **Add Firebase Performance Monitoring**
4. **Implement backend proxy** for API keys
5. **Set up CI/CD** with GitHub Actions
6. **Add error tracking** (Sentry, Firebase Crashlytics)
7. **Optimize performance** with Lighthouse

---

## Additional Resources

- 📚 [Full Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 🔥 [Firebase Documentation](https://firebase.google.com/docs/hosting)
- 💬 [Project Issues](https://github.com/numbpill3d/cyber-prompt-builder/issues)

---

## Need Help?

- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting
- Open an issue on GitHub
- Check Firebase Console logs

---

**Happy Deploying! 🚀**
