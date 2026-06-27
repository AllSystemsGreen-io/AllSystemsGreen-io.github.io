# AllSystemsGreen.io

Static public site for AllSystemsGreen.io, LLC.

## Security Posture

- Static HTML/CSS/SVG only.
- No public login, CMS, database, form backend, analytics, cookies, third-party scripts, or client-side secrets.
- Security headers are defined in `_headers` for static hosts that support Netlify/Cloudflare Pages style header files.
- Hetzner/nginx security headers are defined in `deploy/nginx/allsystemsgreen.io.conf`.
- Project visuals are generated sanitized mockups, not production screenshots.

## Hetzner Hosting

The site is deployed alongside TelemetryBase on Hetzner server `ctrl-telemetrybase-01`.

- VPS IPv4: `87.99.142.245`
- Static release root: `/var/www/allsystemsgreen.io/current`
- TLS certificate: `/etc/letsencrypt/live/allsystemsgreen.io/fullchain.pem`
- Nginx vhost: `/etc/nginx/sites-available/allsystemsgreen.io`
- Versioned vhost source: `deploy/nginx/allsystemsgreen.io.conf`

DNS cutover records:

- `allsystemsgreen.io` A -> `87.99.142.245`
- `www.allsystemsgreen.io` CNAME -> `allsystemsgreen.io`

TLS is issued by Certbot on the VPS. To renew or repair it manually:

```bash
certbot --nginx -d allsystemsgreen.io -d www.allsystemsgreen.io
```

## Local Preview

```powershell
node tools/generate-screenshots.mjs
python -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

## Regenerate Public Mockups

```powershell
node tools/generate-screenshots.mjs
```
