# Cloudflare Pages Build Settings for OneAtATime

## ⚠️ Important: Use Cloudflare Pages, NOT Workers

Your site is a static HTML file, so you need **Cloudflare Pages**, not Workers.

## Correct Build Settings for Cloudflare Pages

### Build Configuration
```
Build command: (leave EMPTY/blank)
Build output directory: /
Root directory: / (or leave as default)
```

### Framework Preset
```
Framework preset: None
```
OR
```
Framework preset: Plain HTML
```

### Branch Settings
```
Production branch: main
Builds for non-production branches: Enabled (optional)
```

### Environment Variables
```
(Leave empty - not needed for static site)
```

## Why These Settings?

1. **Build command: EMPTY**
   - Your `index.html` is already complete
   - No compilation, bundling, or build process needed
   - Cloudflare Pages will serve your file directly

2. **Build output directory: /**
   - Your `index.html` is in the root directory
   - No need to specify a different output folder

3. **Root directory: /**
   - Default is fine
   - Your project structure is simple (just index.html)

4. **Framework preset: None**
   - You're not using React, Vue, Next.js, etc.
   - This is plain HTML/CSS/JavaScript

## What NOT to Use

❌ **Don't use these (for Workers):**
- Build command: `npx wrangler deploy` ← This is for Workers, not Pages!
- Deploy command: `npx wrangler deploy` ← Wrong service!

✅ **Use Cloudflare Pages instead:**
- No build command needed
- Automatic deployment from GitHub

## Step-by-Step in Dashboard

1. Go to **Workers & Pages** → **Pages** (not Workers!)
2. Click **Create application** → **Pages** tab
3. Connect your GitHub repo: `omatthew-tech/OneAtATime`
4. In build settings:
   - **Framework preset**: Select "None" or "Plain HTML"
   - **Build command**: Leave completely blank/empty
   - **Build output directory**: `/` or leave default
   - **Root directory**: `/` or leave default
5. Click **Save and Deploy**

## If You See "Build Failed"

If your build fails, check:

1. **Are you in Pages or Workers?**
   - Make sure you're in **Pages**, not Workers
   - Workers is for serverless functions, Pages is for static sites

2. **Build command should be EMPTY**
   - If you see `npx wrangler deploy`, you're in the wrong place
   - Pages doesn't need a build command for static HTML

3. **Check the build logs**
   - Click "View build" to see error details
   - Common issue: trying to run a build command that doesn't exist

## Quick Reference

| Setting | Value |
|---------|-------|
| Framework preset | None / Plain HTML |
| Build command | (empty) |
| Build output directory | / |
| Root directory | / |
| Production branch | main |

## After Deployment

Your site will be available at:
- `https://oneatatime.pages.dev` (or your custom domain)

Every push to `main` will automatically redeploy!
