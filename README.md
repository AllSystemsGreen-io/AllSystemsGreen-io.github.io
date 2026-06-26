# AllSystemsGreen.io

Static public site for AllSystemsGreen.io, LLC.

## Security Posture

- Static HTML/CSS/SVG only.
- No public login, CMS, database, form backend, analytics, cookies, third-party scripts, or client-side secrets.
- Security headers are defined in `_headers` for static hosts that support Netlify/Cloudflare Pages style header files.
- Project visuals are generated sanitized mockups, not production screenshots.

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
