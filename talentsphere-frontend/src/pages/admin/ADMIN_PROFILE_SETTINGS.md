# Admin Profile and Settings

This document describes the current administrator profile and application
settings screens.

## Admin Profile

`/admin/profile` loads the signed-in administrator profile and live platform
statistics. It supports:

- Editing first name, last name, email, phone, location, and biography.
- Uploading a PNG, JPEG, WebP, or GIF avatar up to 5 MB.
- Displaying account creation and last-login timestamps.
- Displaying live user, job, application, company, and active-user metrics.

The profile and statistics are read from the backend. The screen shows load
and save errors instead of substituting mock values.

## Application Settings

`/admin/settings` provides three tabs:

- **Account**: updates the administrator email address.
- **System status**: displays live database, runtime, cache, and platform
  metrics returned by the backend.
- **Integrations**: reports whether object storage, email delivery, and the
  response cache are configured without exposing secret values.

Settings are deployment-controlled through backend environment variables; the
frontend does not claim to persist configuration that the API does not expose.

## API Endpoints

- `GET /api/admin/profile` — read the administrator profile.
- `PUT /api/admin/profile` — update the administrator profile.
- `POST /api/admin/upload-avatar` — upload an administrator avatar.
- `GET /api/admin/stats` — read aggregate platform statistics.
- `GET /api/admin/system/health` — read verified runtime health and integration
  configuration flags.
- `GET /api/auth/profile` — read the current account email for settings.
- `PUT /api/auth/profile` — update the current account email.

All administrator endpoints require an authenticated administrator session.
Secret configuration values are never returned to the browser.

## Validation

- Verify profile edits, validation errors, and persistence after reload.
- Verify avatar type and size rejection plus successful upload.
- Verify statistics update after platform data changes.
- Verify health refresh and integration configuration states.
- Verify non-administrator accounts cannot access administrator endpoints.
