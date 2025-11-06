# Workspace: Two-Factor Authentication (2FA)

## Context
Add TOTP-based two-factor authentication for user accounts.

## Components
- AuthAPI (backend)
- SettingsUI (frontend)

## Requirements
- Enable/disable 2FA in settings
- Generate QR code for authenticator apps
- Backup codes management
- 2FA prompt on login (trusted device option)

## Notes
- Rate limit verification attempts
- Recovery flow for lost device
