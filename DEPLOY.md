# Deployment Guide: Hear Maxx Astro Migration

This guide details the exact procedure for deploying the high-performance Astro build to Hostinger or any production hosting environment.

---

## 1. Pre-Deployment: Mandatory Backup

Before modifying any server directory or uploading files:

1. **Back up web root files**:
   - Access Hostinger hPanel File Manager (or connect via SSH / SFTP).
   - Compress the entire current `public_html/` directory into a timestamped zip archive (e.g., `backup_wordpress_hearmaxx_YYYY-MM-DD.tar.gz`) and download it locally or move it to a safe backup directory outside `public_html/`.
2. **Back up MySQL database**:
   - In Hostinger hPanel -> Databases -> phpMyAdmin (or via WP-CLI / `mysqldump`).
   - Export the active WordPress database as a `.sql.gz` dump.
3. **Verify DNS & SSL**:
   - Confirm that the SSL certificate (Let's Encrypt) is active and that your domain DNS pointers are correctly configured.

---

## 2. Environment Variables & Production Build

The Hear Maxx Astro codebase is fully environment-driven. The build output dynamically adjusts canonical tags, sitemaps, OpenGraph metadata, JSON-LD schemas, and robots indexing directives based on environment variables.

### Production Environment Variables (`hearmaxx.ca`)
```bash
# In production, indexation is allowed and domain is set to hearmaxx.ca
export PUBLIC_SITE_URL="https://hearmaxx.ca"
export PUBLIC_NOINDEX="false"

# Run clean build
npm run build
```

### Staging Environment Variables (`hostingersite.com` or preview subdomain)
```bash
# In staging, search engines must be strictly blocked (Disallow all, noindex)
export PUBLIC_SITE_URL="https://pink-kingfisher-948450.hostingersite.com"
export PUBLIC_NOINDEX="true"

# Run clean build
npm run build
```

The compiled static site output will be generated inside the `dist/` directory.

---

## 3. Web Root Clean-Up (Critical: Do NOT Mix Files)

> **IMPORTANT**: Leftover WordPress files (`index.php`, `wp-config.php`, `.htaccess`, `wp-content/`, etc.) will conflict with the Astro static routing. Apache/LiteSpeed will prioritize WordPress's `index.php` or mod_rewrite rules, causing the site to continue serving Elementor/WordPress content even after static files are copied.

### Option A: Clean `public_html` Deployment (Recommended)
1. Ensure your backup from Step 1 is safely downloaded.
2. In Hostinger File Manager or via SSH:
   ```bash
   cd public_html
   # Remove all existing WordPress core and plugin files
   rm -rf wp-admin wp-content wp-includes index.php wp-config.php xmlrpc.php license.txt readme.html .htaccess
   ```
3. Upload and extract only the contents of the Astro `dist/` folder directly into `public_html/`.

### Option B: Zero-Downtime Directory Switch (Advanced)
1. Upload the `dist/` folder contents to a new directory: `hearmaxx-astro-v1/`.
2. Update the website root directory in Hostinger hPanel -> Websites -> Manage -> Website Settings -> Change Document Root to `hearmaxx-astro-v1/` (or update Apache virtualhost symlink).

---

## 4. Server Configuration (`.htaccess`)

Ensure an optimized `.htaccess` is present in `public_html/` to support clean URLs, Gzip/Brotli compression, and security headers:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Enforce HTTPS
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Clean URLs (trailing slash or direct file lookup)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.*)$ $1.html [L]

  # Custom 404 Handler
  ErrorDocument 404 /404.html
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/avif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType video/mp4 "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

---

## 5. Post-Deployment Verification Commands

Run these verification commands immediately after upload to ensure complete migration success:

### A. HTTP Status & Headers
```bash
curl -sI https://hearmaxx.ca/
```
*Expected:* `HTTP/2 200` (or `301` redirecting HTTP to HTTPS), `content-type: text/html`.

### B. Zero-WordPress & Zero-Elementor Verification
```bash
curl -s https://hearmaxx.ca/ | grep -Ei "elementor|wp-content|wp-includes|wp-json|xmlrpc"
```
*Expected output:* Empty (0 matches).

### C. Astro Generator Tag Verification
```bash
curl -s https://hearmaxx.ca/ | grep -i "generator"
```
*Expected output:* Contains `<meta name="generator" content="Astro v...`

### D. Robots.txt & Sitemap Verification
```bash
curl -s https://hearmaxx.ca/robots.txt
```
*Expected (Production):*
```txt
User-agent: *
Allow: /

Sitemap: https://hearmaxx.ca/sitemap-index.xml
```

```bash
curl -s https://hearmaxx.ca/sitemap-index.xml
```
*Expected:* XML sitemap referencing `https://hearmaxx.ca/sitemap-0.xml` with all 12 canonical routes.

### E. Automated Multi-Page Live Audit
Run the included verification script:
```bash
node scripts/check-live.mjs https://hearmaxx.ca
```
This script audits all 12 core URLs and 404, validating status codes, lack of WordPress signatures, presence of Astro generator tag, canonical domain, and robots indexing.
