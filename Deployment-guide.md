# Deployment Guide

## Frontend Deployment (React + Vite SPA)

### For Vercel

Create a `vercel.json` file in the root of the `client` folder:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### For Netlify

Create a `netlify.toml` file in the root of the `client` folder:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### For GitHub Pages / Static Hosting

If deploying to a static host without built-in routing, ensure the web server redirects all requests to `index.html`.

**Example with `.htaccess` (Apache):**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Example with Nginx:**

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Build & Deploy Steps

1. **Build the client:**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy the `dist/` folder** to your hosting platform

3. **Ensure environment variables are set:**
   - Set `VITE_API_BASE_URL` to your backend API URL (e.g., `https://api.yourdomain.com`)

---

## Backend Deployment (Node.js Express)

### Environment Setup

Create a `.env` file in the `server` folder:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

### Build & Deploy Steps

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **For production (using PM2 or Docker):**
   ```bash
   pm2 start server.js --name "api"
   ```

---

## Common Issues & Fixes

### ❌ 404 Error on Admin Page After Deployment

**Root Cause:** The static host doesn't redirect non-existent routes to `index.html`.

**Solution:** 
- Add the appropriate redirect configuration (see above for your platform)
- Rebuild and redeploy the frontend

### ❌ API Requests Failing

**Root Cause:** `VITE_API_BASE_URL` is not set or incorrect.

**Solution:**
1. Create a `.env` file in the client folder:
   ```
   VITE_API_BASE_URL=https://your-api-domain.com
   ```
2. Rebuild and redeploy

### ❌ CORS Errors

**Root Cause:** Backend doesn't allow requests from your frontend domain.

**Solution:** Update `server.js` CORS configuration:

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://your-frontend-domain.com', 'http://localhost:3000'],
  credentials: true
}));
```

---

## Quick Checklist

- [ ] Frontend builds successfully: `npm run build`
- [ ] Backend is running and accessible
- [ ] API base URL is correctly configured
- [ ] Routing fallback is configured (vercel.json / netlify.toml / .htaccess / nginx)
- [ ] CORS is properly configured on backend
- [ ] Environment variables are set on deployment platform
- [ ] Admin page loads without 404 error