# Saint-Bernard PHP API

This API is intended for PHP 8.2+ with PDO MySQL and MySQL 8.0+ (or a compatible MariaDB release). It is designed to run locally before the shared hosting account is purchased.

## Local configuration

1. Copy `.env.example` to `.env`.
2. Set `DB_NAME`, `DB_USER`, and `DB_PASSWORD` for a local MySQL database.
3. Keep `.env` private; it is excluded from Git.
4. Import `database/migrations/001_initial_schema.sql` into the database.
5. On an existing database, apply each subsequent migration in order through `database/migrations/010_carousel_image_position.sql`.
6. Set the Next.js `NEXT_PUBLIC_API_URL` to `http://localhost:8098`.
7. Set `APP_ORIGIN` to the exact local Next.js origin and `APP_BASE_URL` to the API origin.
8. Start the API for local development:

```powershell
php -S localhost:8098 -t backend/public backend/public/index.php
```

For the local Windows MySQL instance used during development, start the database in a separate terminal if it is not already running:

```powershell
$mysqlHome = 'C:\Program Files\MySQL\MySQL Server 8.4'
& "$mysqlHome\bin\mysqld.exe" --no-defaults --basedir="$mysqlHome" --datadir="$env:LOCALAPPDATA\MySQL\SaintBernard" --bind-address=127.0.0.1 --port=3306 --mysqlx=0 --console
```

This local instance is bound to the local machine and is not installed as a Windows service.

To register it as an automatically starting Windows service, stop the manually started MySQL process with Ctrl+C in its terminal, then run `scripts/install-local-mysql-service.ps1` from an elevated PowerShell window. The service uses the same local data directory and remains bound to `127.0.0.1`.

On the development PC, the `Saint-Bernard Local PHP API` scheduled task starts the API at user sign-in by running `scripts/start-local-api.ps1`. The script leaves an already healthy API running and writes PHP output to `%LOCALAPPDATA%\SaintBernard\logs`. To remove the automatic startup task, run:

```powershell
Unregister-ScheduledTask -TaskName 'Saint-Bernard Local PHP API'
```

The API uses PHP sessions with HttpOnly cookies and CSRF tokens. The browser must send credentials on API requests. In production, the frontend should use its custom domain and the API its matching `api.` subdomain so they remain same-site; the browser request is still cross-origin and requires credentials.

## Initial administrator

Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in the process environment, then run:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.org"
$securePassword = Read-Host "Initial administrator password" -AsSecureString
$env:BOOTSTRAP_ADMIN_PASSWORD = (New-Object System.Net.NetworkCredential("", $securePassword)).Password
php backend/bin/bootstrap-admin.php
$env:BOOTSTRAP_ADMIN_EMAIL = $null
$env:BOOTSTRAP_ADMIN_PASSWORD = $null
```

The password is stored only as a password hash. The command refuses to run once any administrator exists. Remove the bootstrap environment variables immediately afterward.

## Current endpoints

- `GET /api/health` — verifies that the API can connect to MySQL.
- `POST /api/auth/login` — accepts `{ "email": "...", "password": "..." }`.
- `GET /api/auth/me` — returns the authenticated user and a CSRF token.
- `POST /api/auth/logout` — requires `X-CSRF-Token`.
- `GET /api/banners` — lists active banners.
- `GET /api/carousel-slides` — lists active slides.
- `PATCH /api/admin/carousel-settings` — administrator-only pause or resume for automatic carousel playback; requires `X-CSRF-Token`.
- `POST /api/contributions` — submits a public contribution and optional image/PDF.
- `GET /api/contributions` — lists published contributions without author email addresses.
- `GET /api/media/{category}/{filename}` — serves validated uploaded files.
- `GET /api/admin/dashboard` — administrator-only dashboard data.
- `GET /api/admin/users` — administrator-only account list.
- `POST /api/admin/users` — administrator-only account creation; requires `X-CSRF-Token`.
- `PATCH /api/admin/users/{id}` — administrator-only role, status, or password update; requires `X-CSRF-Token`.
- `POST /api/admin/banners` — administrator-only banner upload and creation.
- `PATCH /api/admin/banners/{id}` — administrator-only banner text, button link, duration, price, payment, and publication updates; requires `X-CSRF-Token`.
- `DELETE /api/admin/banners/{id}` — administrator-only banner deletion; requires `X-CSRF-Token`.
- `POST /api/admin/carousel-slides` — administrator-only slide upload and creation.
- `PATCH /api/admin/carousel-slides/{id}` — administrator-only slide title, description, link, order, crop position, and publication updates; requires `X-CSRF-Token`.
- `DELETE /api/admin/carousel-slides/{id}` — administrator-only slide deletion; requires `X-CSRF-Token`.
- `PATCH` and `DELETE /api/admin/gallery/{id}`, `/api/admin/destins/{id}`, and `/api/admin/videos/{id}` — administrator-only content updates or deletion; require `X-CSRF-Token`.
- `GET /api/admin/contributions` — administrator-only contribution list.
- `POST /api/admin/contributions` — administrator-only creation on behalf of an association account; submissions start pending. The admin editor stores its limited rich-text document in a validated `sb-rich-v1:` format.
- `PATCH /api/admin/contributions/{id}` — administrator-only moderation (pending, published, rejected, or suspended); suspended contributions can also have their title and text edited without replacing the attached file.
- `DELETE /api/admin/contributions/{id}` — administrator-only permanent deletion, including an attached upload.
- `POST /api/stripe/checkout` — creates a Stripe Checkout session.
- `POST /api/stripe/webhook` — verifies and records Stripe payment events.

PDF contributions are read in the browser: selectable text is extracted directly, and pages without a text layer are processed with French OCR. The original PDF remains attached, while the extracted text is submitted as the contribution content. Keep the frontend's self-hosted OCR assets in `public/ocr` when deploying; PDFs are not sent to an external OCR service. PDF extraction is limited to 30 pages and 8 MB.

The admin contribution editor supports bold, highlighting, and paragraph alignment. Its public display renders only validated document nodes and marks; existing plain-text contributions remain supported.

The frontend is being connected to these endpoints. Do not deploy this API until local MySQL integration and end-to-end tests are complete.
