# Cloudflare Pages Deployment Guide for OneAtATime

## Overview
Your site is a static HTML/CSS/JavaScript application that can be deployed directly to Cloudflare Pages without any build process.

## Deployment Steps

### Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. **Sign in to Cloudflare**
   - Go to https://dash.cloudflare.com/
   - Sign in or create an account

2. **Access Cloudflare Pages**
   - In the left sidebar, click "Workers & Pages"
   - Click "Create application"
   - Select "Pages" tab
   - Click "Connect to Git"

3. **Connect Your GitHub Repository**
   - Select "GitHub" as your Git provider
   - Authorize Cloudflare to access your GitHub account
   - Select the repository: `omatthew-tech/OneAtATime`
   - Click "Begin setup"

4. **Configure Build Settings**
   - **Project name**: `oneatatime` (or your preferred name)
   - **Production branch**: `main`
   - **Framework preset**: `None` (or "Plain HTML")
   - **Build command**: Leave empty (no build needed)
   - **Build output directory**: `/` (root directory)
   - **Root directory**: `/` (leave as default)

5. **Environment Variables** (Optional)
   - No environment variables needed for this static site
   - Click "Save and Deploy"

6. **Wait for Deployment**
   - Cloudflare will clone your repo and deploy
   - First deployment takes 1-2 minutes
   - You'll get a URL like: `https://oneatatime.pages.dev`

### Option 2: Deploy via Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create `wrangler.toml`** (optional, for advanced config)
   ```toml
   name = "oneatatime"
   pages_build_output_dir = "."
   ```

4. **Deploy**
   ```bash
   wrangler pages deploy .
   ```

## Custom Domain Setup

1. **In Cloudflare Dashboard**
   - Go to your Pages project
   - Click "Custom domains"
   - Click "Set up a custom domain"
   - Enter your domain (e.g., `oneatatime.com`)

2. **DNS Configuration**
   - Cloudflare will provide DNS records to add
   - If your domain is already on Cloudflare, it will auto-configure
   - If not, add the CNAME record provided

## Important Notes

### File Structure
- Your `index.html` is in the root directory ✅
- No build process needed ✅
- All assets (CSS, JS) are inline in the HTML ✅

### Redirects
- A `_redirects` file has been created to handle SPA routing if needed
- This ensures all routes serve `index.html` with 200 status

### Performance
- Cloudflare Pages automatically:
  - Serves your site via CDN (global edge network)
  - Enables HTTP/2 and HTTP/3
  - Provides SSL/TLS certificates
  - Optimizes asset delivery

### Continuous Deployment
- Every push to `main` branch will trigger automatic deployment
- Preview deployments are created for pull requests
- You can view deployment history in the dashboard

## Post-Deployment Checklist

- [ ] Verify site loads at the Cloudflare Pages URL
- [ ] Test all animations and interactions
- [ ] Check mobile responsiveness
- [ ] Verify form submission (if backend is added later)
- [ ] Set up custom domain (optional)
- [ ] Configure custom domain SSL (automatic with Cloudflare)

## Troubleshooting

### If deployment fails:
1. Check build logs in Cloudflare dashboard
2. Ensure `index.html` is in the root directory
3. Verify GitHub repository is public (or Cloudflare has access)

### If site doesn't load:
1. Check the deployment status in dashboard
2. Verify the build output directory is correct (`/`)
3. Check browser console for errors

### Performance issues:
1. Cloudflare Pages automatically optimizes static assets
2. Consider moving large inline styles/scripts to external files if needed
3. Enable Cloudflare's Auto Minify in dashboard (Speed > Optimization)

## Next Steps

1. **Analytics** (Optional)
   - Enable Cloudflare Web Analytics in dashboard
   - Free analytics without cookies/privacy concerns

2. **Custom Domain**
   - Set up your custom domain for branding

3. **Environment Variables** (If needed later)
   - Add API keys or config via dashboard
   - Access via `process.env.VARIABLE_NAME` in build scripts

4. **Preview Deployments**
   - Every PR gets a preview URL
   - Share with team for testing before merging

## Support

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Cloudflare Community: https://community.cloudflare.com/
